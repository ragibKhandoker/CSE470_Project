const pickupPointModel = require('../models/pickupPointModel');
const db = require('../config/db');

/**
 * Controller for NGO Pickup Points
 */

// Helper to resolve NGO id from user id
const getNgoId = async (userId) => {
  const res = await db.query('SELECT id FROM ngos WHERE user_id = $1', [userId]);
  if (res.rows.length > 0) return res.rows[0].id;
  // Fallback to first NGO
  const anyNgo = await db.query('SELECT id FROM ngos LIMIT 1');
  return anyNgo.rows.length > 0 ? anyNgo.rows[0].id : 1;
};

const getPickupPoints = async (req, res, next) => {
  try {
    let ngoId = null;
    if (req.user && req.user.role === 'ngo') {
      ngoId = await getNgoId(req.user.id);
    }
    const points = await pickupPointModel.getAll(ngoId);
    return res.status(200).json({
      message: 'Pickup points retrieved successfully',
      data: points
    });
  } catch (error) {
    next(error);
  }
};

const createPickupPoint = async (req, res, next) => {
  try {
    const { name, address, operating_hours, active_items, status } = req.body;
    if (!name || !address) {
      return res.status(400).json({ message: 'Hub name and address are required' });
    }

    const ngoId = await getNgoId(req.user.id);
    const newPoint = await pickupPointModel.create({
      ngo_id: ngoId,
      name,
      address,
      operating_hours: operating_hours || '8 AM – 9 PM',
      active_items: active_items || 0,
      status: status || 'Active'
    });

    return res.status(201).json({
      message: 'Pickup point created successfully',
      data: newPoint
    });
  } catch (error) {
    next(error);
  }
};

const updatePickupPoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, operating_hours, active_items, status } = req.body;

    const existing = await pickupPointModel.getById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pickup point not found' });
    }

    const updated = await pickupPointModel.update(id, {
      name,
      address,
      operating_hours,
      active_items,
      status
    });

    return res.status(200).json({
      message: 'Pickup point updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const togglePickupPointStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await pickupPointModel.toggleStatus(id);
    if (!updated) {
      return res.status(404).json({ message: 'Pickup point not found' });
    }

    return res.status(200).json({
      message: `Pickup point status changed to ${updated.status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deletePickupPoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await pickupPointModel.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Pickup point not found' });
    }

    return res.status(200).json({
      message: 'Pickup point deleted successfully',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPickupPoints,
  createPickupPoint,
  updatePickupPoint,
  togglePickupPointStatus,
  deletePickupPoint
};
