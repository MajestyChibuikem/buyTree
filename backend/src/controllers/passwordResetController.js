const db = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
  // Using Gmail for now - you can switch to SendGrid, AWS SES, etc.
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
    },
  });
};

// Generate secure random token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user by email
    const userResult = await db.query(
      'SELECT id, first_name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success even if user doesn't exist (security best practice)
    // This prevents email enumeration attacks
    if (userResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Invalidate any existing tokens for this user
    await db.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );

    // Store token in database
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      const transporter = createTransporter();

      await transporter.sendMail({
        from: `"BuyTree" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Reset Your BuyTree Password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">BuyTree</h1>
              </div>

              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>

                <p>Hi ${user.first_name},</p>

                <p>We received a request to reset your password for your BuyTree account. Click the button below to reset it:</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}"
                     style="background: #059669; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Reset Password
                  </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #059669; word-break: break-all;">${resetUrl}</a>
                </p>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                  </p>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                  If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  BuyTree - Your Campus Marketplace<br>
                  This is an automated email, please do not reply.
                </p>
              </div>
            </body>
          </html>
        `,
        text: `
          Hi ${user.first_name},

          We received a request to reset your password for your BuyTree account.

          Click the link below to reset your password:
          ${resetUrl}

          This link will expire in 1 hour for security reasons.

          If you didn't request a password reset, you can safely ignore this email.

          BuyTree - Your Campus Marketplace
        `,
      });

      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Don't expose email sending failure to user
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

// Verify reset token
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
    }

    // Check if token exists and is valid
    const result = await db.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.email
       FROM password_reset_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.used = FALSE AND rt.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: result.rows[0].email,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify reset token',
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Check if token exists and is valid
    const tokenResult = await db.query(
      `SELECT rt.id, rt.user_id, u.email, u.first_name
       FROM password_reset_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.used = FALSE AND rt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    const tokenData = tokenResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, tokenData.user_id]
    );

    // Mark token as used
    await db.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [tokenData.id]
    );

    // Send confirmation email
    try {
      const transporter = createTransporter();

      await transporter.sendMail({
        from: `"BuyTree" <${process.env.EMAIL_USER}>`,
        to: tokenData.email,
        subject: 'Your BuyTree Password Has Been Reset',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">BuyTree</h1>
              </div>

              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Password Successfully Reset</h2>

                <p>Hi ${tokenData.first_name},</p>

                <p>Your BuyTree password has been successfully reset. You can now log in with your new password.</p>

                <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                    <strong>🔒 Security Tip:</strong> If you didn't make this change, please contact our support immediately.
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/login"
                     style="background: #059669; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Log In to BuyTree
                  </a>
                </div>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  BuyTree - Your Campus Marketplace
                </p>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
};
