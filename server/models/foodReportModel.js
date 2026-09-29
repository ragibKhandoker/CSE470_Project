const db = require('../config/db');

/**
 * Food Report Model - manages receiver reports regarding food quality and disputes
 */

const createReport = async ({
  reporter_id,
  food_request_id,
  food_post_id,
  donor_id,
  food_name,
  donor_name,
  reason,
  description,
  proof_image_url
}) => {
  const query = `
    INSERT INTO food_reports (
      reporter_id,
      food_request_id,
      food_post_id,
      donor_id,
      food_name,
      donor_name,
      reason,
      description,
      proof_image_url,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *;
  `;
  const result = await db.query(query, [
    reporter_id,
    food_request_id || null,
    food_post_id || null,
    donor_id || null,
    food_name,
    donor_name || null,
    reason,
    description,
    proof_image_url || null
  ]);
  return result.rows[0];
};

const getAllReports = async ({ status, search } = {}) => {
  let query = `
    SELECT 
      rep.*,
      reporter.name AS reporter_name,
      reporter.email AS reporter_email,
      reporter.phone AS reporter_phone,
      COALESCE(donor.name, rep.donor_name) AS resolved_donor_name,
      donor.email AS donor_email,
      donor.phone AS donor_phone,
      fp.food_type,
      fp.quantity AS original_quantity,
      fp.district,
      fp.thana,
      fp.area_ward,
      fr.pickup_code,
      fr.requested_quantity,
      fr.fulfilled_at
    FROM food_reports rep
    JOIN users reporter ON rep.reporter_id = reporter.id
    LEFT JOIN users donor ON rep.donor_id = donor.id
    LEFT JOIN food_posts fp ON rep.food_post_id = fp.id
    LEFT JOIN food_requests fr ON rep.food_request_id = fr.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'all') {
    params.push(status);
    query += ` AND rep.status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    query += ` AND (
      LOWER(rep.food_name) LIKE $${params.length} OR
      LOWER(reporter.name) LIKE $${params.length} OR
      LOWER(COALESCE(donor.name, rep.donor_name, '')) LIKE $${params.length} OR
      LOWER(rep.reason) LIKE $${params.length} OR
      LOWER(rep.description) LIKE $${params.length}
    )`;
  }

  query += ` ORDER BY rep.created_at DESC;`;

  const result = await db.query(query, params);
  return result.rows;
};

const getReportsByReporterId = async (reporterId) => {
  const query = `
    SELECT * FROM food_reports
    WHERE reporter_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await db.query(query, [reporterId]);
  return result.rows;
};

const getReportById = async (id) => {
  const query = `
    SELECT 
      rep.*,
      reporter.name AS reporter_name,
      reporter.email AS reporter_email,
      reporter.phone AS reporter_phone,
      COALESCE(donor.name, rep.donor_name) AS resolved_donor_name,
      donor.email AS donor_email,
      donor.phone AS donor_phone,
      fp.food_type,
      fp.quantity AS original_quantity,
      fp.district,
      fp.thana,
      fp.area_ward,
      fr.pickup_code,
      fr.requested_quantity,
      fr.fulfilled_at
    FROM food_reports rep
    JOIN users reporter ON rep.reporter_id = reporter.id
    LEFT JOIN users donor ON rep.donor_id = donor.id
    LEFT JOIN food_posts fp ON rep.food_post_id = fp.id
    LEFT JOIN food_requests fr ON rep.food_request_id = fr.id
    WHERE rep.id = $1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updateReportStatus = async (id, { status, admin_notes, action_taken }) => {
  const isResolved = status === 'resolved' || status === 'dismissed';
  const query = `
    UPDATE food_reports
    SET 
      status = COALESCE($1, status),
      admin_notes = COALESCE($2, admin_notes),
      action_taken = COALESCE($3, action_taken),
      resolved_at = ${isResolved ? 'CURRENT_TIMESTAMP' : 'NULL'},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
  `;
  const result = await db.query(query, [status, admin_notes, action_taken, id]);
  return result.rows[0];
};

module.exports = {
  createReport,
  getAllReports,
  getReportsByReporterId,
  getReportById,
  updateReportStatus
};
