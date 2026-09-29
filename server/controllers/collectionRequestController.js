const collectionRequestModel = require('../models/collectionRequestModel');

/**
 * CollectionRequest Controller handles NGO requests to collect food from donors
 */

const createCollectionRequest = async (req, res, next) => {
  try {
    // TODO: implement logic
    return res.status(201).json({ message: 'Collection request created (scaffold)' });
  } catch (error) {
    next(error);
  }
};

const getMyCollectionRequests = async (req, res, next) => {
  try {
    // TODO: implement logic
    return res.status(200).json({ message: 'List of collection requests (scaffold)', data: [] });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    // TODO: implement logic
    return res.status(200).json({ message: 'Collection status updated (scaffold)' });
  } catch (error) {
    next(error);
  }
};

const deleteCollectionRequest = async (req, res, next) => {
  try {
    // TODO: implement logic
    return res.status(200).json({ message: 'Collection request deleted (scaffold)' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCollectionRequest,
  getMyCollectionRequests,
  updateStatus,
  deleteCollectionRequest
};
