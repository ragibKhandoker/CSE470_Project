const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Report routes
router.post('/', protect, reportController.createReport);
router.get('/', protect, requireRole('admin'), reportController.getAllReports);
router.patch('/:id/status', protect, requireRole('admin'), reportController.updateReportStatus);

module.exports = router;
