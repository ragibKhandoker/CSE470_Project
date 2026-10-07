let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcryptjs');
}
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const userModel = require('../models/userModel');

const db = require('../config/db');
const { sendOtpEmail } = require('../services/emailService');
const captchaService = require('../utils/captchaService');

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_SIGN_IN_ENABLED = /^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID);
const googleClient = GOOGLE_SIGN_IN_ENABLED ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// In-memory OTP Store for password recovery
const otpStore = new Map();

/**
 * Auth Controller handles user registration, login, profile retrieval, update, verification & OTP reset
 */

const getCaptcha = (req, res) => {
  try {
    const captcha = captchaService.generateCaptcha();
    return res.status(200).json({
      message: 'Captcha challenge generated',
      data: captcha
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate CAPTCHA' });
  }
};

const checkUserExists = async (req, res, next) => {
  try {
    const { phone, email, identifier } = req.query;

    if (phone && phone.trim()) {
      const existingPhone = await userModel.findByPhone(phone.trim());
      if (existingPhone) {
        return res.status(200).json({
          exists: true,
          field: 'phone',
          message: 'User already exists with this phone number. Please log in instead.'
        });
      }
    }

    if (email && email.trim()) {
      const existingEmail = await userModel.findByEmail(email.trim());
      if (existingEmail) {
        return res.status(200).json({
          exists: true,
          field: 'email',
          message: 'User already exists with this email address. Please log in instead.'
        });
      }
    }

    if (identifier && identifier.trim()) {
      const existingUser = await userModel.findByPhoneOrEmail(identifier.trim());
      if (existingUser) {
        return res.status(200).json({
          exists: true,
          field: 'identifier',
          message: 'User account found for this phone number or email.'
        });
      }
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, phone, nid, email, address, password, role, captchaId, captchaAnswer } = req.body;
    const nid_pdf = req.file ? req.file.buffer : null;

    // 1. Check if phone already registered (Immediate duplicate feedback)
    if (phone && phone.trim()) {
      const existingPhone = await userModel.findByPhone(phone.trim());
      if (existingPhone) {
        return res.status(409).json({
          userExists: true,
          field: 'phone',
          message: 'User already exists with this phone number. Please log in instead.'
        });
      }
    }

    // 2. Check if email already registered (Immediate duplicate feedback)
    if (email && email.trim()) {
      const existingEmail = await userModel.findByEmail(email.trim());
      if (existingEmail) {
        return res.status(409).json({
          userExists: true,
          field: 'email',
          message: 'User already exists with this email address. Please log in instead.'
        });
      }
    }

    // 3. Verify CAPTCHA only if challenge response was submitted
    if (captchaId && captchaAnswer) {
      if (!captchaService.verifyCaptcha(captchaId, captchaAnswer)) {
        return res.status(400).json({
          message: 'Security verification failed: Invalid or expired CAPTCHA code. Please type the characters shown in the security box.'
        });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const userRole = role ? role.toLowerCase() : 'donor';

    const newUser = await userModel.createUser({
      name,
      phone: phone ? phone.trim() : '',
      nid,
      nid_pdf,
      email: email ? email.trim() : null,
      address,
      password_hash,
      role: userRole
    });

    if (userRole.includes('ngo')) {
      const ngoModel = require('../models/ngoModel');
      await ngoModel.createNgo({
        user_id: newUser.id,
        organization_name: req.body.organization_name || name,
        registration_no: req.body.registration_no || nid || null,
        registration_document_pdf: nid_pdf
      });
    }

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: newUser
    });
  } catch (error) {
    if (error.code === '23505') {
      const detail = String(error.detail || error.message || '').toLowerCase();
      const constraint = String(error.constraint || '').toLowerCase();
      if (detail.includes('phone') || constraint.includes('phone')) {
        return res.status(409).json({
          userExists: true,
          field: 'phone',
          message: 'User already exists with this phone number. Please log in instead.'
        });
      }
      if (detail.includes('email') || constraint.includes('email')) {
        return res.status(409).json({
          userExists: true,
          field: 'email',
          message: 'User already exists with this email address. Please log in instead.'
        });
      }
      return res.status(409).json({
        userExists: true,
        message: 'User already exists with this phone number or email address. Please log in instead.'
      });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, email, identifier, password } = req.body;
    const loginInput = (identifier || phone || email || '').trim();

    if (!loginInput || !password) {
      return res.status(400).json({ message: 'Phone/Email and password are required' });
    }

    const user = await userModel.findByPhoneOrEmail(loginInput);

    if (!user) {
      return res.status(404).json({
        userExists: false,
        field: 'identifier',
        message: 'No account found with this phone number or email. Please sign up first.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        userExists: true,
        field: 'password',
        message: 'Incorrect password. Account exists for this user. Please try again or reset your password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, ngo_staff_role: user.ngo_staff_role, parent_ngo_id: user.parent_ngo_id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Track user login and active time
    try {
      await userModel.updateLastLogin(user.id);
    } catch (errLastLogin) {
      console.error('Failed to update last_login:', errLastLogin.message);
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        nid: user.nid,
        role: user.role,
        ngo_staff_role: user.ngo_staff_role,
        parent_ngo_id: user.parent_ngo_id,
        verification_status: user.verification_status
      }
    });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    if (!GOOGLE_SIGN_IN_ENABLED) {
      return res.status(503).json({
        message: 'Google sign-in is not configured. Set a valid GOOGLE_CLIENT_ID in server/.env.'
      });
    }

    const { token: idToken, role = 'donor' } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await userModel.findByEmail(email);

    if (!user) {
      const dummyPhone = `g_${googleId.slice(0, 10)}`;
      const randomPasswordHash = await bcrypt.hash(googleId + (process.env.JWT_SECRET || 'secret'), 10);
      const normalizedRole = role.toLowerCase();

      user = await userModel.createUser({
        name: name || 'Google User',
        phone: dummyPhone,
        email,
        password_hash: randomPasswordHash,
        role: normalizedRole,
        address: 'Registered via Google OAuth'
      });

      if (normalizedRole === 'ngo') {
        const ngoModel = require('../models/ngoModel');
        await ngoModel.createNgo({
          user_id: user.id,
          organization_name: name || 'NGO Organization'
        });
      }
    }

    const jwtToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    try {
      await userModel.updateLastLogin(user.id);
    } catch (errLastLogin) {
      console.error('Failed to update last_login on googleAuth:', errLastLogin.message);
    }

    res.status(200).json({
      message: 'Google Sign-In successful',
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        nid: user.nid,
        role: user.role,
        verification_status: user.verification_status
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Google authentication failed: ' + error.message });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(200).json({ message: 'If an account exists with this email, an OTP code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    console.log(`\n==========================================`);
    console.log(`🔑 PASSWORD RESET OTP FOR ${email}: [ ${otp} ]`);
    console.log(`==========================================\n`);

    // Send real email via Nodemailer SMTP
    let emailResult;
    try {
      emailResult = await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error('Email Sending Error:', mailErr);
    }

    res.status(200).json({
      message: `OTP verification email sent to ${email}`,
      previewUrl: emailResult?.previewUrl || null
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }

    const record = otpStore.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: 'OTP code has expired' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Incorrect OTP code' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    const result = await db.query(
      'UPDATE users SET password_hash = $1, plain_password = $2 WHERE LOWER(email) = LOWER($3) RETURNING id, email',
      [password_hash, newPassword, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User account not found with this email address.' });
    }

    console.log(`\n==========================================`);
    console.log(`✅ DATABASE UPDATED! New Password set for ${email}`);
    console.log(`==========================================\n`);

    otpStore.delete(email.toLowerCase());

    res.status(200).json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a request to Super Admin for password reset / change
 */
const requestPasswordReset = async (req, res, next) => {
  try {
    const { identifier, reason } = req.body;
    const inputIdentifier = (identifier || '').trim();

    // Check if user is authenticated or finding by identifier
    let targetUser = null;
    if (req.user && req.user.id) {
      const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      targetUser = userRes.rows[0];
    } else {
      if (!inputIdentifier) {
        return res.status(400).json({ message: 'Please provide your registered Email address or Phone number.' });
      }
      const userRes = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR phone = $1 OR name = $1 LIMIT 1',
        [inputIdentifier]
      );
      targetUser = userRes.rows[0];
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'No account found matching this email or phone number.' });
    }

    if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
      return res.status(403).json({ message: 'Super admin accounts cannot request password reset via this portal.' });
    }

    // Insert into password_reset_requests
    const insertRes = await db.query(
      `INSERT INTO password_reset_requests (user_id, identifier, reason, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *;`,
      [targetUser.id, inputIdentifier || targetUser.email || targetUser.phone, reason || 'User requested password reset']
    );

    // Notify Super Admin
    try {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         SELECT id, '🔑 Password Reset Request', 'User ' || $1 || ' has submitted a password reset request.', 'password_reset_request', '/admin/users?tab=password-requests'
         FROM users WHERE role::text IN ('admin', 'super_admin');`,
        [targetUser.name]
      );
    } catch (notifErr) {
      console.warn('Could not insert admin notification for reset request:', notifErr.message);
    }

    return res.status(201).json({
      message: 'Password reset request submitted successfully to Super Admin. Once approved, you will receive a secure reset link in your notification panel.',
      request: insertRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a reset token (used when user opens /reset-password?token=...)
 */
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Reset token is required.' });
    }

    const checkRes = await db.query(
      `SELECT prr.*, u.name, u.email, u.phone 
       FROM password_reset_requests prr
       JOIN users u ON prr.user_id = u.id
       WHERE prr.reset_token = $1 AND prr.status = 'approved' AND prr.token_expires_at > NOW()
       LIMIT 1;`,
      [token]
    );

    if (checkRes.rows.length === 0) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    return res.status(200).json({
      valid: true,
      message: 'Token is valid',
      user: {
        name: checkRes.rows[0].name,
        identifier: checkRes.rows[0].identifier
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete password reset with approved token
 */
const resetPasswordWithToken = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const checkRes = await db.query(
      `SELECT * FROM password_reset_requests 
       WHERE reset_token = $1 AND status = 'approved' AND token_expires_at > NOW()
       LIMIT 1;`,
      [token]
    );

    if (checkRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }

    const resetReq = checkRes.rows[0];
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.query(
      `UPDATE users 
       SET password_hash = $1,last_active_at = NOW() 
       WHERE id = $3;`,
      [password_hash, newPassword, resetReq.user_id]
    );

    // Mark reset request as completed
    await db.query(
      `UPDATE password_reset_requests 
       SET status = 'completed', resolved_at = NOW() 
       WHERE id = $1;`,
      [resetReq.id]
    );

    // Send confirmation notification to user
    try {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, '✅ Password Changed Successfully', 'Your password has been successfully updated. You can now log in.', 'password_reset_success');`,
        [resetReq.user_id]
      );
    } catch (e) {
      console.warn('Could not insert confirmation notification:', e.message);
    }

    return res.status(200).json({
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, email, address, nid } = req.body;
    const nid_pdf = req.file ? req.file.buffer : null;

    const updatedUser = await userModel.updateUserProfile(req.user.id, {
      name,
      phone,
      email,
      address,
      nid,
      nid_pdf
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const verifyUser = async (req, res, next) => {
  try {
    const updated = await userModel.updateVerificationStatus(req.params.id, 'verified');
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User verified', user: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  signup: register,
  login,
  checkUserExists,
  googleAuth,
  forgotPassword,
  resetPassword,
  requestPasswordReset,
  verifyResetToken,
  resetPasswordWithToken,
  getMe,
  updateProfile,
  verifyUser,
  getCaptcha
};
