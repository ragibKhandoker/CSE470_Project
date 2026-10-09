const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes via JWT Bearer token authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    // TODO: Verify JWT token & attach user object to req.user
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Middleware to restrict route access by role (donor, ngo, receiver, admin)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    const normalizeRole = (role) => {
      const normalized = String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      return normalized === 'superadmin' ? 'super_admin' : normalized;
    };
    const userRole = normalizeRole(req.user?.role);
    const allowedRoles = roles.map(normalizeRole);

    if (!req.user || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: `Access denied. Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      req.user = decoded;
    }
  } catch (e) {
    // Ignore invalid token for optional auth
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  requireRole
};
