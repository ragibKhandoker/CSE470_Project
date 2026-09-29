const express = require('express');
const router = express.Router();
const servingLogController = require('../controllers/servingLogController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ServingLog routes
router.post('/', protect, requireRole('ngo', 'admin', 'super_admin'), servingLogController.createServingLog);
router.get('/', protect, requireRole('ngo', 'admin', 'super_admin'), servingLogController.getServingLogs);
router.delete('/:id', protect, requireRole('ngo', 'admin', 'super_admin'), servingLogController.deleteServingLog);

module.exports = router;
