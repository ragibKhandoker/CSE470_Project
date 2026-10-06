const express = require('express');
const router = express.Router();
const pickupPointController = require('../controllers/pickupPointController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Public or receiver view of pickup points
router.get('/', pickupPointController.getPickupPoints);

// NGO actions
router.post('/', protect, requireRole('ngo', 'admin', 'super_admin'), pickupPointController.createPickupPoint);
router.put('/:id', protect, requireRole('ngo', 'admin', 'super_admin'), pickupPointController.updatePickupPoint);
router.patch('/:id/status', protect, requireRole('ngo', 'admin', 'super_admin'), pickupPointController.togglePickupPointStatus);
router.delete('/:id', protect, requireRole('ngo', 'admin', 'super_admin'), pickupPointController.deletePickupPoint);

module.exports = router;
