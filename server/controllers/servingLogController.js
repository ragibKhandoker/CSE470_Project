const servingLogModel = require('../models/servingLogModel');
const db = require('../config/db');

/**
 * ServingLog Controller handles logging meal distribution by NGOs
 */

// Helper to resolve NGO id from user id
const getNgoId = async (userId) => {
  const res = await db.query('SELECT id FROM ngos WHERE user_id = $1', [userId]);
  if (res.rows.length > 0) return res.rows[0].id;
  const anyNgo = await db.query('SELECT id FROM ngos LIMIT 1');
  return anyNgo.rows.length > 0 ? anyNgo.rows[0].id : 1;
};

const createServingLog = async (req, res, next) => {
  try {
    const { donation_ref, meals_served, location, notes, served_at } = req.body;

    if (!meals_served || !location) {
      return res.status(400).json({ message: 'Meals served and distribution location are required.' });
    }

    const ngoId = await getNgoId(req.user.id);
    const newLog = await servingLogModel.createServingLog({
      ngo_id: ngoId,
      donation_ref: donation_ref || 'Community Food Relief',
      meals_served: parseInt(meals_served, 10),
      location,
      notes: notes || '',
      served_at: served_at || new Date().toISOString()
    });

    return res.status(201).json({
      message: 'Serving log entry recorded successfully!',
      data: newLog
    });
  } catch (error) {
    next(error);
  }
};

const getServingLogs = async (req, res, next) => {
  try {
    let logs;
    if (req.user && req.user.role === 'ngo') {
      const ngoId = await getNgoId(req.user.id);
      logs = await servingLogModel.findByNgoId(ngoId);
    } else {
      logs = await servingLogModel.getAll();
    }

    return res.status(200).json({
      message: 'Serving logs retrieved successfully',
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

const deleteServingLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await servingLogModel.deleteServingLog(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Serving log entry not found' });
    }
    return res.status(200).json({
      message: 'Serving log entry deleted successfully',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createServingLog,
  getServingLogs,
  deleteServingLog
};
