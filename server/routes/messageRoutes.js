const express = require('express');
const messageController = require('../controllers/messageController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/admin', requireRole('admin', 'super_admin'), messageController.sendAdminMessage);
router.get('/admin-inbox', messageController.getAdminInbox);
router.post('/', messageController.sendMessage);
router.get('/conversation/:userId', messageController.getConversation);

module.exports = router;