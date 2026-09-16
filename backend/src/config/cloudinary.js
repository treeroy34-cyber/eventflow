const cloudinary = require('cloudinary').v2;

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;
const cloudinary_url = process.env.CLOUDINARY_URL;

if (cloud_name && api_key && api_secret) {
    cloudinary.config({
        cloud_name: cloud_name.trim(),
        api_key: api_key.trim(),
        api_secret: api_secret.trim(),
        secure: true
    });
} else if (cloudinary_url) {
    cloudinary.config({
        cloudinary_url: cloudinary_url.trim(),
        secure: true
    });
}

module.exports = cloudinary;
