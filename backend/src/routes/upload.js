const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, restrictTo } = require('../middleware/auth');

const isCloudinaryConfigured = !!(
    (process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET) ||
    process.env.CLOUDINARY_URL
);

let storage;

if (isCloudinaryConfigured) {
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    const cloudinary = require('../config/cloudinary');
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            return {
                folder: 'eventflow',
                resource_type: 'auto',
            };
        },
    });
} else {
    const uploadDirs = [
        path.join(__dirname, '../../../frontend/public/uploads'),
        path.join(__dirname, '../../public/uploads')
    ];
    uploadDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
        }
    });

    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDirs[0]);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const safeName = `event_${Date.now()}_${Math.round(Math.random() * 1E6)}${ext}`;
            cb(null, safeName);
        }
    });
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const getFileUrl = (file) => {
    if (!file) return null;
    const url = file.path || file.secure_url || file.url;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;
    try {
        const backendUploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(backendUploadDir)) fs.mkdirSync(backendUploadDir, { recursive: true });
        const destPath = path.join(backendUploadDir, file.filename);
        if (file.path && file.path !== destPath && fs.existsSync(file.path)) {
            fs.copyFileSync(file.path, destPath);
        }
    } catch (e) {}
    return `/uploads/${file.filename}`;
};

// POST /api/upload - Single image upload
router.post('/', protect, restrictTo('ADMIN', 'STAFF'), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err.message);
            return res.status(400).json({ message: err.message || 'File upload error.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file.' });
        }
        res.status(200).json({
            message: 'Image uploaded successfully.',
            url: getFileUrl(req.file)
        });
    });
});

// POST /api/upload/multiple - Multiple images upload
router.post('/multiple', protect, restrictTo('ADMIN', 'STAFF'), (req, res, next) => {
    upload.array('images', 10)(req, res, (err) => {
        if (err) {
            console.error('Multer/Upload error:', err.message);
            return res.status(400).json({ message: err.message || 'File upload error.' });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Please upload at least one image.' });
        }
        const urls = req.files.map(file => getFileUrl(file));
        res.status(200).json({
            message: `${urls.length} images uploaded successfully.`,
            urls: urls
        });
    });
});

module.exports = router;

