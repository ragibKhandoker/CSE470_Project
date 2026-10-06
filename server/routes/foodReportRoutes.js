const express = require('express');
const router = express.Router();
const foodReportController = require('../controllers/foodReportController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Receiver submits a food report with optional proof image
router.post('/', protect, upload.single('proof_image'), foodReportController.submitFoodReport);

// Receiver gets their own submitted reports
router.get('/my-reports', protect, foodReportController.getMyReports);

// Super Admin gets all food reports with filters
router.get('/', protect, requireRole('admin'), foodReportController.getAllFoodReports);

// Super Admin gets single report detail
router.get('/:id', protect, requireRole('admin'), foodReportController.getReportDetails);

// Super Admin updates report status and action taken
router.patch('/:id/status', protect, requireRole('admin'), foodReportController.updateReportStatus);

module.exports = router;
