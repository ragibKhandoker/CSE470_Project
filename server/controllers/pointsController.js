const pointsModel = require('../models/pointsModel');

const mine = async (req, res, next) => {
  try {
    if (req.user.role !== 'receiver') return res.status(403).json({ message: 'Receiver account required.' });
    return res.json({ data: await pointsModel.getMine(req.user.id), point_value_bdt: 1 });
  } catch (error) { next(error); }
};

const receiverBalances = async (req, res, next) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Admin account required.' });
    return res.json({ data: await pointsModel.getReceiverBalances() });
  } catch (error) { next(error); }
};

const grant = async (req, res, next) => {
  try {
    const receiverId = Number(req.body.receiver_id);
    const points = Number(req.body.points);
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    if (!Number.isInteger(receiverId) || receiverId < 1 || !Number.isFinite(points) || points <= 0 || points > 1000000 || !/^\d+(?:\.\d{1,2})?$/.test(String(req.body.points))) {
      return res.status(400).json({ message: 'Choose a receiver and enter a positive point amount with up to 2 decimals.' });
    }
    if (note.length < 3 || note.length > 240) return res.status(400).json({ message: 'Provide a reason (3–240 characters).' });
    const result = await pointsModel.grant({ receiverId, adminId: req.user.id, points, note });
    if (!result) return res.status(404).json({ message: 'Receiver account was not found.' });
    return res.status(201).json({ message: 'Points added to the receiver account.', data: result });
  } catch (error) { next(error); }
};

module.exports = { mine, receiverBalances, grant };
