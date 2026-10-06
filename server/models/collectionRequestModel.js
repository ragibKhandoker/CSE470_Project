const db = require('../config/db');

/**
 * CollectionRequest Model - database operations for collection_requests table
 */

const createCollectionRequest = async (requestData) => {
  // TODO: implement query
};

const findById = async (id) => {
  // TODO: implement query
};

const findByNgoId = async (ngoId) => {
  // TODO: implement query
};

const findByFoodPostId = async (foodPostId) => {
  // TODO: implement query
};

const updateStatus = async (id, status) => {
  // TODO: implement query
};

const deleteCollectionRequest = async (id) => {
  // TODO: implement query
};

module.exports = {
  createCollectionRequest,
  findById,
  findByNgoId,
  findByFoodPostId,
  updateStatus,
  deleteCollectionRequest
};
