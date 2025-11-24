const express = require('express');
const router = express.Router();
const {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
} = require('../controllers/passwordResetController');

// Request password reset (public)
router.post('/request', requestPasswordReset);

// Verify reset token (public)
router.get('/verify/:token', verifyResetToken);

// Reset password (public)
router.post('/reset', resetPassword);

module.exports = router;
