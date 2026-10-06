const express = require('express');
const router = express.Router();
const ngoController = require('../controllers/ngoController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { validateNgoProfile } = require('../validators/ngoValidator');

// NGO routes
router.get('/', ngoController.getAllNgos);
router.post('/register', protect, requireRole('ngo'), validateNgoProfile, ngoController.registerNgoProfile);
router.get('/profile', protect, requireRole('ngo'), ngoController.getNgoProfile);
router.put('/profile', protect, requireRole('ngo'), ngoController.updateNgoProfile);

module.exports = router;
