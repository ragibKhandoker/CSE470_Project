const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/pointsController');
router.get('/mine', protect, requireRole('receiver'), controller.mine);
router.get('/admin/receivers', protect, requireRole('admin', 'super_admin'), controller.receiverBalances);
router.post('/admin/grant', protect, requireRole('admin', 'super_admin'), controller.grant);
module.exports = router;
