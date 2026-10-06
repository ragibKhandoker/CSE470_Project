const db = require('../config/db');

/**
 * ServingLog Model - database operations for serving_logs table
 */

const createServingLog = async ({
  ngo_id,
  donation_ref,
  meals_served,
  location,
  notes,
  served_at
}) => {
  const query = `
    INSERT INTO serving_logs (
      ngo_id,
      donation_ref,
      meals_served,
      location,
      notes,
      served_at
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_TIMESTAMP))
    RETURNING *;
  `;
  const values = [
    ngo_id,
    donation_ref || null,
    meals_served,
    location,
    notes || '',
    served_at || null
  ];
  const result = await db.query(query, values);
  return result.rows[0];
};

const findById = async (id) => {
  const query = `SELECT * FROM serving_logs WHERE id = $1;`;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const findByNgoId = async (ngoId) => {
  const query = `
    SELECT 
      sl.*,
      ngo.organization_name
    FROM serving_logs sl
    LEFT JOIN ngos ngo ON sl.ngo_id = ngo.id
    WHERE sl.ngo_id = $1
    ORDER BY sl.served_at DESC, sl.id DESC;
  `;
  const result = await db.query(query, [ngoId]);
  return result.rows;
};

const getAll = async () => {
  const query = `
    SELECT 
      sl.*,
      ngo.organization_name
    FROM serving_logs sl
    LEFT JOIN ngos ngo ON sl.ngo_id = ngo.id
    ORDER BY sl.served_at DESC, sl.id DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};

const updateServingLog = async (id, { donation_ref, meals_served, location, notes, served_at }) => {
  const query = `
    UPDATE serving_logs
    SET
      donation_ref = COALESCE($1, donation_ref),
      meals_served = COALESCE($2, meals_served),
      location = COALESCE($3, location),
      notes = COALESCE($4, notes),
      served_at = COALESCE($5, served_at)
    WHERE id = $6
    RETURNING *;
  `;
  const values = [donation_ref, meals_served, location, notes, served_at, id];
  const result = await db.query(query, values);
  return result.rows[0];
};

const deleteServingLog = async (id) => {
  const query = `DELETE FROM serving_logs WHERE id = $1 RETURNING *;`;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  createServingLog,
  findById,
  findByNgoId,
  getAll,
  updateServingLog,
  deleteServingLog
};
