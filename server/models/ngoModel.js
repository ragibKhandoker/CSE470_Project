const db = require('../config/db');

/**
 * NGO Model - Database operations for ngos table
 */

const createNgo = async ({ user_id, organization_name, registration_no, registration_document_pdf }) => {
  const query = `
    INSERT INTO ngos (user_id, organization_name, registration_no, registration_document_pdf)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, organization_name, registration_no, verified_by_admin, created_at;
  `;
  const values = [user_id, organization_name, registration_no || null, registration_document_pdf || null];
  const result = await db.query(query, values);
  return result.rows[0];
};

const findByUserId = async (user_id) => {
  const query = `
    SELECT id, user_id, organization_name, registration_no, (registration_document_pdf IS NOT NULL) AS has_reg_doc, verified_by_admin, created_at
    FROM ngos
    WHERE user_id = $1;
  `;
  const result = await db.query(query, [user_id]);
  return result.rows[0];
};

const getAllNgos = async () => {
  const query = `
    SELECT n.id, n.user_id, n.organization_name, n.registration_no, (n.registration_document_pdf IS NOT NULL) AS has_reg_doc, n.verified_by_admin, n.created_at,
           u.name AS contact_person, u.email, u.phone, u.verification_status
    FROM ngos n
    JOIN users u ON n.user_id = u.id
    ORDER BY n.created_at DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};

const updateVerification = async (user_id, verified) => {
  const query = `
    UPDATE ngos
    SET verified_by_admin = $1
    WHERE user_id = $2
    RETURNING id, user_id, organization_name, verified_by_admin;
  `;
  const result = await db.query(query, [verified, user_id]);
  return result.rows[0];
};

module.exports = {
  createNgo,
  findByUserId,
  getAllNgos,
  updateVerification
};
