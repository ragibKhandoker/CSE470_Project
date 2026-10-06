const express = require('express');
const router = express.Router();
const ngoStaffController = require('../controllers/ngoStaffController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All staff endpoints require authentication and 'ngo' role
router.use(protect);
router.use(requireRole('ngo', 'admin', 'super_admin'));

// Middleware: Only NGO Organization Admins or Super Admins can manage staff or assign roles
const requireNgoAdmin = (req, res, next) => {
  if (req.user.ngo_staff_role && !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Access denied: Only NGO Administrators can manage staff or assign roles.'
    });
  }
  next();
};

router.get('/', ngoStaffController.listStaff);
router.post('/', requireNgoAdmin, ngoStaffController.createStaff);
router.patch('/:id/role', requireNgoAdmin, ngoStaffController.assignRole);
router.patch('/:id/assign-role', requireNgoAdmin, ngoStaffController.assignRole);
router.patch('/:id', requireNgoAdmin, ngoStaffController.updateStaff);
router.put('/:id', requireNgoAdmin, ngoStaffController.updateStaff);
router.delete('/:id', requireNgoAdmin, ngoStaffController.removeStaff);

module.exports = router;
