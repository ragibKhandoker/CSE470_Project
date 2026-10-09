const ngoModel = require('../models/ngoModel');

/**
 * NGO Controller handles NGO registration profiles, verification queues, and collection points
 */

const registerNgoProfile = async (req, res, next) => {
  try {
    // TODO: implement logic
    return res.status(201).json({ message: 'NGO profile submitted (scaffold)' });
  } catch (error) {
    next(error);
  }
};

const getNgoProfile = async (req, res, next) => {
  try {
    // TODO: implement logic
    return res.status(200).json({ message: 'NGO profile details (scaffold)' });
  } catch (error) {
    next(error);
  }
};

const updateNgoProfile = async (req, res, next) => {
  try {
    // TODO: implement logic
    return res.status(200).json({ message: 'NGO profile updated (scaffold)' });
  } catch (error) {
    next(error);
  }
};

const getPaymentWallets = async (req, res, next) => {
  try {
    if (req.user.parent_ngo_id || req.user.ngo_staff_role) {
      return res.status(403).json({ message: 'Only the NGO account owner can manage payment wallets.' });
    }
    const wallets = await ngoModel.getPaymentWallets(req.user.id);
    if (!wallets) return res.status(404).json({ message: 'NGO account was not found.' });
    return res.status(200).json({ data: wallets });
  } catch (error) {
    next(error);
  }
};

const updatePaymentWallets = async (req, res, next) => {
  try {
    if (req.user.parent_ngo_id || req.user.ngo_staff_role) {
      return res.status(403).json({ message: 'Only the NGO account owner can manage payment wallets.' });
    }
    const normalize = (value) => typeof value === 'string' ? value.replace(/[\s-]/g, '') : '';
    const wallets = {
      bkash_number: normalize(req.body.bkash_number),
      rocket_number: normalize(req.body.rocket_number),
      nagad_number: normalize(req.body.nagad_number)
    };
    const isValidWallet = (number) => /^(?:\+?88)?01[3-9]\d{8}$/.test(number);
    if (Object.values(wallets).some((number) => number && !isValidWallet(number))) {
      return res.status(400).json({ message: 'Enter a valid Bangladesh mobile wallet number for each provider.' });
    }
    const updated = await ngoModel.updatePaymentWallets(req.user.id, wallets);
    if (!updated) return res.status(404).json({ message: 'NGO account was not found.' });
    return res.status(200).json({ message: 'NGO payment wallet numbers saved.', data: updated });
  } catch (error) {
    next(error);
  }
};

const getAllNgos = async (req, res, next) => {
  try {
    const ngos = await ngoModel.getAllNgos();
    return res.status(200).json({ message: 'List of NGOs', data: ngos });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerNgoProfile,
  getNgoProfile,
  updateNgoProfile,
  getPaymentWallets,
  updatePaymentWallets,
  getAllNgos
};
