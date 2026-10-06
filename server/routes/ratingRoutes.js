const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

// Rating routes
router.post('/', protect, ratingController.createRating);
router.get('/targets', protect, ratingController.getRatingTargets);
router.get('/my-ratings', protect, ratingController.getMyRatings);
router.get('/user/:userId', ratingController.getRatingsForUser);
router.delete('/:id', protect, ratingController.deleteRating);

module.exports = router;
