const foodReportModel = require('../models/foodReportModel');
const db = require('../config/db');
const { uploadToSupabase } = require('../utils/supabaseStorage');

/**
 * Controller for handling Food Quality and Receiver Safety Reports
 */

const submitFoodReport = async (req, res, next) => {
  try {
    const reporterId = req.user.id;
    const {
      food_request_id,
      food_post_id,
      donor_id,
      food_name,
      donor_name,
      reason,
      description
    } = req.body;

    const proof_image_url = req.file
      ? await uploadToSupabase(req.file, 'report-proofs')
      : (req.body.proof_image_url || null);

    const parsedRequestId = food_request_id ? parseInt(food_request_id, 10) : null;
    const parsedPostId = food_post_id ? parseInt(food_post_id, 10) : null;
    const parsedDonorId = donor_id ? parseInt(donor_id, 10) : null;

    if (!food_name || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Food name, reason, and detailed description are required.'
      });
    }

    // Check if user already reported this request
    if (parsedRequestId) {
      const existing = await db.query(
        'SELECT id FROM food_reports WHERE reporter_id = $1 AND food_request_id = $2',
        [reporterId, parsedRequestId]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a report for this meal request.'
        });
      }
    }

    const report = await foodReportModel.createReport({
      reporter_id: reporterId,
      food_request_id: parsedRequestId,
      food_post_id: parsedPostId,
      donor_id: parsedDonorId,
      food_name,
      donor_name,
      reason,
      description,
      proof_image_url
    });

    // Notify Super Admins
    try {
      const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins.rows) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, is_read)
           VALUES ($1, $2, $3, false)`,
          [
            admin.id,
            '🚩 New Food Report Filed',
            `Receiver reported "${food_name}" (${reason}) from donor "${donor_name || 'Donor'}".`
          ]
        );
      }
    } catch (notifErr) {
      console.error('Error dispatching admin notification for food report:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Food report submitted successfully. Super Admin has been notified.',
      report
    });
  } catch (error) {
    next(error);
  }
};

const getAllFoodReports = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const reports = await foodReportModel.getAllReports({ status, search });

    // Aggregate counts for admin dashboard cards
    const countRes = await db.query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending,
        COUNT(CASE WHEN status = 'investigating' THEN 1 END)::int AS investigating,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END)::int AS resolved,
        COUNT(CASE WHEN status = 'dismissed' THEN 1 END)::int AS dismissed
      FROM food_reports;
    `);

    return res.status(200).json({
      success: true,
      counts: countRes.rows[0] || { total: 0, pending: 0, investigating: 0, resolved: 0, dismissed: 0 },
      reports
    });
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reporterId = req.user.id;
    const reports = await foodReportModel.getReportsByReporterId(reporterId);
    return res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

const getReportDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await foodReportModel.getReportById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, action_taken } = req.body;

    const updated = await foodReportModel.updateReportStatus(id, {
      status,
      admin_notes,
      action_taken
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Notify the reporter about update
    if (updated.reporter_id) {
      try {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, is_read)
           VALUES ($1, $2, $3, false)`,
          [
            updated.reporter_id,
            `📋 Food Report Update: ${status.toUpperCase()}`,
            `Your report on "${updated.food_name}" has been marked as ${status}. ${action_taken ? `Action taken: ${action_taken}.` : ''}`
          ]
        );
      } catch (e) {
        console.error('Error notifying reporter of status update:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Report status updated successfully.',
      report: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFoodReport,
  getAllFoodReports,
  getMyReports,
  getReportDetails,
  updateReportStatus
};
