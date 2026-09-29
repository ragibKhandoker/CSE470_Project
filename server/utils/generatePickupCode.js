/**
 * Helper to generate secure random 6-digit pickup verification codes
 */
const generatePickupCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = generatePickupCode;
