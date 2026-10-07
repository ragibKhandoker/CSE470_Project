const express = require('express');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { assistantLimiter } = require('../middleware/rateLimiter');
const receiverAssistantController = require('../controllers/receiverAssistantController');

const router = express.Router();
const assistantRoles = [
  'receiver',
  'donor',
  'ngo',
  'ngo_admin',
  'ngo_staff',
  'collection_staff',
  'distributor_staff',
  'admin',
  'super_admin'
];

router.post(
  '/',
  protect,
  requireRole(...assistantRoles),
  assistantLimiter,
  receiverAssistantController.askAssistant
);

router.post(
  '/stream',
  protect,
  requireRole(...assistantRoles),
  assistantLimiter,
  receiverAssistantController.streamAssistant
);

module.exports = router;
