const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Notification routes
router.get('/', protect, notificationController.getMyNotifications);
router.get('/thread/:postId', protect, notificationController.getFoodPostThread);
router.patch('/mark-all-read', protect, notificationController.markAllNotificationsRead);
router.patch('/:id/read', protect, notificationController.markNotificationRead);

module.exports = router;
