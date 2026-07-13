const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { protect, restrictTo } = require('../middleware/auth');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'eventflow', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/upload - Upload an image to Cloudinary (Admin only)
router.post('/', protect, restrictTo('ADMIN'), upload.single('image'), (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file.' });
        }

        // Cloudinary returns the URL in req.file.path
        res.status(200).json({
            message: 'Image uploaded successfully.',
            url: req.file.path
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/upload/multiple - Upload multiple images to Cloudinary (Admin only)
router.post('/multiple', protect, restrictTo('ADMIN'), (req, res, next) => {
    // Call multer manually so we can catch middleware-level errors
    upload.array('images', 10)(req, res, (err) => {
        if (err) {
            console.error('Multer/Cloudinary error:', err);
            return res.status(400).json({ message: err.message || 'File upload error.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Please upload at least one image.' });
        }

        // Cloudinary returns the URL in each file's path property
        const urls = req.files.map(file => file.path);

        res.status(200).json({
            message: `${urls.length} images uploaded successfully.`,
            urls: urls
        });
    });
});

module.exports = router;
