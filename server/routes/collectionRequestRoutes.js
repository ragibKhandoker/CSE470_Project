const express = require('express');
const router = express.Router();
const collectionRequestController = require('../controllers/collectionRequestController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Collection request routes (NGO <-> Donor)
router.post('/', protect, requireRole('ngo'), collectionRequestController.createCollectionRequest);
router.get('/my-requests', protect, requireRole('ngo', 'donor'), collectionRequestController.getMyCollectionRequests);
router.patch('/:id/status', protect, requireRole('ngo', 'donor'), collectionRequestController.updateStatus);
router.delete('/:id', protect, requireRole('ngo'), collectionRequestController.deleteCollectionRequest);

module.exports = router;
