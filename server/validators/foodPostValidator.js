/**
 * Food Post Input Validator
 */

const validateFoodPost = (req, res, next) => {
  const { title, quantity, pickupAddress, expiryTime } = req.body;

  if (!title || !quantity || !pickupAddress || !expiryTime) {
    return res.status(400).json({ message: 'Title, quantity, pickup address, and expiry time are required.' });
  }

  next();
};

module.exports = {
  validateFoodPost
};
