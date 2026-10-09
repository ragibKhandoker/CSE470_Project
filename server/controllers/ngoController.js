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
  getAllNgos
};
