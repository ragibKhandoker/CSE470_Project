const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const signupValidation = [
  body('name')
    .customSanitizer((v) => (typeof v === 'string' ? v.trim() : v))
    .notEmpty()
    .withMessage('Name is required'),
  body('nid')
    .customSanitizer((v) => (typeof v === 'string' ? v.trim() : v))
    .notEmpty()
    .withMessage('NID is required'),
  body('phone')
    .customSanitizer((v) => (typeof v === 'string' ? v.trim() : v))
    .notEmpty()
    .withMessage('Phone number is required'),
  body('password')
    .customSanitizer((v) => (typeof v === 'string' ? v.trim() : v))
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .customSanitizer((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v))
    .isIn(['donor', 'receiver', 'ngo', 'admin'])
    .withMessage('Role must be one of: donor, receiver, ngo, admin'),
  validate,
];

const loginValidation = [
  body('phone')
    .optional()
    .customSanitizer((v) => (typeof v === 'string' ? v.trim() : v)),
  body('email')
    .optional()
    .customSanitizer((v) => (typeof v === 'string' ? v.trim() : v)),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

module.exports = {
  signupValidation,
  validateRegister: signupValidation,
  loginValidation,
  validateLogin: loginValidation,
};
