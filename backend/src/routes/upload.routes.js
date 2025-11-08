const express = require('express');
const router = express.Router();
const {
  upload,
  uploadImage,
  uploadMultipleImages,
} = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB per image.',
    });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed',
    });
  }
  next(err);
};

// Protected routes (require authentication)
router.post('/image', authenticateToken, upload.single('image'), handleUploadError, uploadImage);
router.post('/images', authenticateToken, upload.array('images', 5), handleUploadError, uploadMultipleImages);

module.exports = router;
