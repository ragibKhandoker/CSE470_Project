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

const getPaymentWallets = async (userId) => {
  const result = await db.query(
    `SELECT ngo_bkash_wallet_number AS bkash_number,
            ngo_rocket_wallet_number AS rocket_number,
            ngo_nagad_wallet_number AS nagad_number
     FROM users
     WHERE id = $1 AND role::text = 'ngo'`,
    [userId]
  );
  return result.rows[0] || null;
};

const updatePaymentWallets = async (userId, { bkash_number, rocket_number, nagad_number }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE users
       SET ngo_bkash_wallet_number = $1,
           ngo_rocket_wallet_number = $2,
           ngo_nagad_wallet_number = $3
       WHERE id = $4 AND role::text = 'ngo'
       RETURNING id`,
      [bkash_number, rocket_number, nagad_number, userId]
    );
    if (!updated.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    // Apply account defaults to active distributions without an override.
    await client.query(
      `UPDATE food_posts
       SET distribution_bkash_number = COALESCE(distribution_bkash_number, $1),
           distribution_rocket_number = COALESCE(distribution_rocket_number, $2),
           distribution_nagad_number = COALESCE(distribution_nagad_number, $3)
       WHERE distribution_ngo_user_id = $4
         AND status::text IN ('available', 'at_ngo_point')`,
      [bkash_number, rocket_number, nagad_number, userId]
    );
    await client.query('COMMIT');
    return { bkash_number, rocket_number, nagad_number };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createNgo,
  findByUserId,
  getAllNgos,
  updateVerification,
  getPaymentWallets,
  updatePaymentWallets
};
