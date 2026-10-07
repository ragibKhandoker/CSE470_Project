const express = require('express');
const messageController = require('../controllers/messageController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/admin', requireRole('admin', 'super_admin'), messageController.sendAdminMessage);
router.post('/admin-reply', requireRole('donor', 'receiver'), messageController.replyToAdmin);
router.get('/admin-inbox', requireRole('donor', 'receiver'), messageController.getAdminInbox);
router.get('/admin/user/:userId', requireRole('admin', 'super_admin'), messageController.getAdminUserConversation);
router.post('/', messageController.sendMessage);
router.get('/conversation/:userId', messageController.getConversation);

module.exports = router;