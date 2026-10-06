/**
 * NGO Registration Profile Input Validator
 */

const validateNgoProfile = (req, res, next) => {
  const { organizationName, registrationNumber, contactPhone, address } = req.body;

  if (!organizationName || !registrationNumber || !contactPhone || !address) {
    return res.status(400).json({ message: 'Organization name, registration number, contact phone, and address are required.' });
  }

  next();
};

module.exports = {
  validateNgoProfile
};
