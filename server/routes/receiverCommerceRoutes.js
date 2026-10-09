const express = require('express');
const { protect, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/receiverCommerceController');

const router = express.Router();
router.use(protect, requireRole('receiver'));

router.get('/cart', controller.getCart);
router.post('/cart', controller.addCartItem);
router.patch('/cart/:id', controller.updateCartItem);
router.delete('/cart/:id', controller.deleteCartItem);
router.get('/wishlist', controller.getWishlist);
router.post('/wishlist', controller.addWishlistItem);
router.delete('/wishlist/:id', controller.deleteWishlistItem);
router.post('/checkout', controller.checkout);

module.exports = router;
