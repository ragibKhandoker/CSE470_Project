const express = require('express');
const router = express.Router();
const foodRequestController = require('../controllers/foodRequestController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/receipts directory exists
const receiptsDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// Multer Storage config for proof of receipt images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, receiptsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `receipt-${req.params.id || 'photo'}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Food request routes
router.post('/', protect, foodRequestController.createFoodRequest);
router.get('/my-requests', protect, foodRequestController.getMyFoodRequests);
router.get('/incoming', protect, foodRequestController.getIncomingFoodRequests);
router.patch('/:id/status', protect, foodRequestController.updateFoodRequestStatus);
router.patch('/:id/payment', protect, foodRequestController.updateFoodPayment);
router.post('/verify-code', protect, foodRequestController.verifyPickupCode);
router.get('/lookup-code/:code', protect, foodRequestController.lookupPickupCode);
router.post('/:id/receipt', protect, upload.single('receipt_photo'), foodRequestController.uploadReceiptPhoto);

// NGO Pickup Request Flow
router.post('/ngo-pickup', protect, foodRequestController.createNgoPickupRequest);
router.get('/donor-pickup-requests', protect, foodRequestController.getDonorPickupRequests);
router.get('/ngo-pickup-requests', protect, foodRequestController.getNgoPickupRequests);
router.patch('/:id/pickup-respond', protect, foodRequestController.respondToPickupRequest);

// NGO Staff Lifecycle Flow
router.patch('/:id/assign-staff', protect, foodRequestController.assignReceivingStaff);
router.patch('/:id/mark-picked-up', protect, foodRequestController.markPickedUp);
router.patch('/:id/mark-at-hub', protect, foodRequestController.markAtHub);
router.patch('/:id/post-distributing', protect, foodRequestController.postDistributing);
router.patch('/:id/wallets', protect, foodRequestController.updateDistributionWallets);
router.post('/:id/handover', protect, foodRequestController.handoverPackets);

module.exports = router;
