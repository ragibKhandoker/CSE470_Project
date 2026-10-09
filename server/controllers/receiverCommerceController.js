const db = require('../config/db');
const commerceModel = require('../models/receiverCommerceModel');
const captchaService = require('../utils/captchaService');

const parsePositiveInteger = (value) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
};

const getCart = async (req, res, next) => {
  try {
    const items = await commerceModel.listCart(req.user.id);
    return res.json({ data: items });
  } catch (error) { next(error); }
};

const addCartItem = async (req, res, next) => {
  try {
    const foodPostId = parsePositiveInteger(req.body.food_post_id);
    const quantity = parsePositiveInteger(req.body.quantity || 1);
    if (!foodPostId || !quantity || quantity > 100) {
      return res.status(400).json({ message: 'Choose a valid meal and portion quantity.' });
    }
    const item = await commerceModel.addToCart(req.user.id, foodPostId, quantity);
    return res.status(201).json({ message: 'Meal added to your cart.', data: item });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const itemId = parsePositiveInteger(req.params.id);
    const quantity = parsePositiveInteger(req.body.quantity);
    if (!itemId || !quantity || quantity > 100) {
      return res.status(400).json({ message: 'Enter a valid portion quantity.' });
    }
    const item = await commerceModel.setCartQuantity(req.user.id, itemId, quantity);
    if (!item) return res.status(404).json({ message: 'Cart item not found or quantity exceeds the listed stock.' });
    return res.json({ message: 'Cart updated.', data: item });
  } catch (error) { next(error); }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const itemId = parsePositiveInteger(req.params.id);
    if (!itemId) return res.status(400).json({ message: 'Invalid cart item.' });
    const removed = await commerceModel.removeCartItem(req.user.id, itemId);
    if (!removed) return res.status(404).json({ message: 'Cart item was not found.' });
    return res.json({ message: 'Meal removed from your cart.' });
  } catch (error) { next(error); }
};

const getWishlist = async (req, res, next) => {
  try {
    return res.json({ data: await commerceModel.listWishlist(req.user.id) });
  } catch (error) { next(error); }
};

const addWishlistItem = async (req, res, next) => {
  try {
    const foodPostId = parsePositiveInteger(req.body.food_post_id);
    if (!foodPostId) return res.status(400).json({ message: 'Choose a valid meal.' });
    const item = await commerceModel.addToWishlist(req.user.id, foodPostId);
    return res.status(201).json({ message: 'Meal saved to your wishlist.', data: item });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

const deleteWishlistItem = async (req, res, next) => {
  try {
    const itemId = parsePositiveInteger(req.params.id);
    if (!itemId) return res.status(400).json({ message: 'Invalid wishlist item.' });
    const removed = await commerceModel.removeWishlistItem(req.user.id, itemId);
    if (!removed) return res.status(404).json({ message: 'Wishlist item was not found.' });
    return res.json({ message: 'Meal removed from your wishlist.' });
  } catch (error) { next(error); }
};

const checkout = async (req, res, next) => {
  try {
    if (!req.body.captchaId || !captchaService.verifyCaptcha(req.body.captchaId, req.body.captchaAnswer)) {
      return res.status(400).json({ message: 'Security verification failed. Complete the CAPTCHA and try again.' });
    }
    const verification = await db.query('SELECT verification_status FROM users WHERE id = $1 AND role::text = $2', [req.user.id, 'receiver']);
    if (verification.rows[0]?.verification_status !== 'verified') {
      return res.status(403).json({ message: 'Verify your receiver profile before placing a purchase request.' });
    }
    const orders = await commerceModel.checkout(req.user.id, String(req.body.notes || '').trim().slice(0, 500));
    const total = orders.reduce((sum, order) => sum + Number(order.purchase_price_bdt || 0), 0);
    return res.status(201).json({
      message: 'Purchase request sent to the NGO. No online payment was taken.',
      data: { orders, total_bdt: Number(total.toFixed(2)) }
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.code === '23505') return res.status(409).json({ message: 'A request for one of these meals already exists. Refresh your cart.' });
    next(error);
  }
};

module.exports = { getCart, addCartItem, updateCartItem, deleteCartItem, getWishlist, addWishlistItem, deleteWishlistItem, checkout };
