const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, restrictTo } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

const isCloudinaryConfigured = () => !!(
    (process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET) ||
    process.env.CLOUDINARY_URL
);

// Memory storage buffers the entire file safely in memory
// This avoids serverless stream piping issues where chunks are dropped or empty
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadBufferToCloudinary = async (buffer, mimetype = 'image/jpeg') => {
    const base64Data = `data:${mimetype};base64,${buffer.toString('base64')}`;
    return await cloudinary.uploader.upload(base64Data, {
        folder: 'eventflow',
        resource_type: 'image'
    });
};

// POST /api/upload - Single image upload
router.post('/', protect, restrictTo('ADMIN', 'STAFF'), (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Multer upload error:', err.message);
            return res.status(400).json({ message: err.message || 'File upload error.' });
        }
        if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
            return res.status(400).json({ message: 'Please select a valid image file.' });
        }

        try {
            if (isCloudinaryConfigured()) {
                const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype);
                return res.status(200).json({
                    message: 'Image uploaded successfully.',
                    url: result.secure_url
                });
            } else {
                const safeName = `event_${Date.now()}_${Math.round(Math.random() * 1E6)}${path.extname(req.file.originalname || '.jpg').toLowerCase()}`;
                const uploadDir = path.join(__dirname, '../../public/uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                fs.writeFileSync(path.join(uploadDir, safeName), req.file.buffer);
                return res.status(200).json({
                    message: 'Image uploaded successfully.',
                    url: `/uploads/${safeName}`
                });
            }
        } catch (uploadErr) {
            console.error('Cloudinary upload error:', uploadErr);
            return res.status(400).json({
                message: uploadErr.message || 'Image upload failed.',
                details: uploadErr.error || uploadErr.message || null
            });
        }
    });
});

// POST /api/upload/multiple - Multiple images upload
router.post('/multiple', protect, restrictTo('ADMIN', 'STAFF'), (req, res) => {
    upload.array('images', 10)(req, res, async (err) => {
        if (err) {
            console.error('Multer multiple upload error:', err.message);
            return res.status(400).json({ message: err.message || 'File upload error.' });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Please select at least one image.' });
        }

        try {
            if (isCloudinaryConfigured()) {
                const uploadPromises = req.files.map(f => uploadBufferToCloudinary(f.buffer, f.mimetype));
                const results = await Promise.all(uploadPromises);
                return res.status(200).json({
                    message: `${results.length} images uploaded successfully.`,
                    urls: results.map(r => r.secure_url)
                });
            } else {
                const uploadDir = path.join(__dirname, '../../public/uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                const urls = req.files.map(f => {
                    const safeName = `event_${Date.now()}_${Math.round(Math.random() * 1E6)}${path.extname(f.originalname || '.jpg').toLowerCase()}`;
                    fs.writeFileSync(path.join(uploadDir, safeName), f.buffer);
                    return `/uploads/${safeName}`;
                });
                return res.status(200).json({
                    message: `${urls.length} images uploaded successfully.`,
                    urls: urls
                });
            }
        } catch (uploadErr) {
            console.error('Cloudinary multiple upload error:', uploadErr);
            return res.status(400).json({
                message: uploadErr.message || 'Gallery images upload failed.',
                details: uploadErr.error || uploadErr.message || null
            });
        }
    });
});

module.exports = router;

