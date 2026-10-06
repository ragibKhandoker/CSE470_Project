const db = require('../config/db');
const { encrypt, decrypt, decryptFields } = require('../utils/encryption');

/**
 * User Model - database operations for users table
 */

const createUser = async ({ name, phone, nid, nid_pdf, email, address, password_hash, plain_password, role }) => {
  // Encrypt sensitive identity field (NID) with AES-256 before inserting to database
  const encryptedNid = encrypt(nid);
  const query = `
    INSERT INTO users (name, phone, nid, nid_pdf, email, address, password_hash, plain_password, role)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, name, phone, nid, email, address, role, verification_status, created_at;
  `;
  const values = [name, phone, encryptedNid, nid_pdf || null, email || null, address || null, password_hash, plain_password || null, role];
  const result = await db.query(query, values);
  return decryptFields(result.rows[0]);
};

const findById = async (id) => {
  const query = `
    SELECT id, name, phone, nid, (nid_pdf IS NOT NULL) AS has_nid_pdf, email, address, role, plain_password, verification_status, ngo_staff_role, parent_ngo_id, created_at
    FROM users
    WHERE id = $1;
  `;
  const result = await db.query(query, [id]);
  return decryptFields(result.rows[0]);
};

const findByPhone = async (phone) => {
  const query = `SELECT * FROM users WHERE phone = $1;`;
  const result = await db.query(query, [phone]);
  return decryptFields(result.rows[0]);
};

const findByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE LOWER(email) = LOWER($1);`;
  const result = await db.query(query, [email]);
  return decryptFields(result.rows[0]);
};

const findByPhoneOrEmail = async (identifier) => {
  if (!identifier) return null;
  const query = `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR phone = $1;`;
  const result = await db.query(query, [identifier.trim()]);
  return decryptFields(result.rows[0]);
};

const findByRole = async (role) => {
  const query = `
    SELECT id, name, phone, nid, email, address, role, plain_password, verification_status, ngo_staff_role, parent_ngo_id, created_at
    FROM users
    WHERE role = $1;
  `;
  const result = await db.query(query, [role]);
  return result.rows.map(r => decryptFields(r));
};

const updateVerificationStatus = async (id, status) => {
  const query = `
    UPDATE users
    SET verification_status = $1
    WHERE id = $2
    RETURNING id, name, phone, role, verification_status;
  `;
  const result = await db.query(query, [status, id]);
  return result.rows[0];
};

const updateUserProfile = async (id, { name, phone, email, address, nid, nid_pdf }) => {
  // Encrypt updated NID with AES-256 before updating database
  const encryptedNid = nid !== undefined ? encrypt(nid) : undefined;
  const query = `
    UPDATE users
    SET 
      name = COALESCE($1, name),
      phone = COALESCE($2, phone),
      email = COALESCE($3, email),
      address = COALESCE($4, address),
      nid = COALESCE($5, nid),
      nid_pdf = COALESCE($6, nid_pdf)
    WHERE id = $7
    RETURNING id, name, phone, nid, (nid_pdf IS NOT NULL) AS has_nid_pdf, email, address, role, plain_password, verification_status, created_at;
  `;
  const values = [name, phone, email, address, encryptedNid, nid_pdf || null, id];
  const result = await db.query(query, values);
  return decryptFields(result.rows[0]);
};

const updateLastLogin = async (id) => {
  const query = `
    UPDATE users 
    SET last_login = NOW(), last_active_at = NOW() 
    WHERE id = $1 
    RETURNING id, last_login, last_active_at;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updateLastActive = async (id) => {
  const query = `
    UPDATE users 
    SET last_active_at = NOW() 
    WHERE id = $1 
    RETURNING id, last_active_at;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

/**
 * Safely and atomically delete a user and clean up related records
 */
const deleteUserById = async (id) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete user ratings
    await client.query('DELETE FROM ratings WHERE author_id = $1 OR target_user_id = $1', [id]);

    // 2. Delete messages where user was sender or receiver
    await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [id]);

    // 3. Delete notifications
    await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);

    // 4. Delete collection requests made by this user
    await client.query('DELETE FROM collection_requests WHERE ngo_id = $1', [id]);

    // 5. Delete receiver food requests
    await client.query('DELETE FROM food_requests WHERE receiver_id = $1', [id]);

    // 6. Delete NGO profile and associated pickup points/logs if exists
    const ngoRes = await client.query('SELECT id FROM ngos WHERE user_id = $1', [id]);
    if (ngoRes.rows.length > 0) {
      const ngoId = ngoRes.rows[0].id;
      await client.query('UPDATE food_requests SET distributed_pickup_point_id = NULL WHERE distributed_pickup_point_id IN (SELECT id FROM pickup_points WHERE ngo_id = $1)', [ngoId]);
      await client.query('UPDATE food_posts SET pickup_point_id = NULL WHERE pickup_point_id IN (SELECT id FROM pickup_points WHERE ngo_id = $1)', [ngoId]);
      await client.query('DELETE FROM serving_logs WHERE ngo_id = $1', [ngoId]);
      await client.query('DELETE FROM pickup_points WHERE ngo_id = $1', [ngoId]);
      await client.query('DELETE FROM ngos WHERE id = $1', [ngoId]);
    }

    // 7. Delete donor food posts and their associated messages/requests
    const postsRes = await client.query('SELECT id FROM food_posts WHERE donor_id = $1', [id]);
    const postIds = postsRes.rows.map(p => p.id);
    if (postIds.length > 0) {
      await client.query('DELETE FROM messages WHERE food_post_id = ANY($1::int[])', [postIds]);
      await client.query('DELETE FROM collection_requests WHERE food_post_id = ANY($1::int[])', [postIds]);
      await client.query('DELETE FROM food_requests WHERE food_post_id = ANY($1::int[])', [postIds]);
      await client.query('DELETE FROM food_posts WHERE donor_id = $1', [id]);
    }

    // 8. Nullify staff references if user was staff
    await client.query('UPDATE food_requests SET assigned_staff_id = NULL WHERE assigned_staff_id = $1', [id]);
    await client.query('UPDATE food_requests SET picked_up_by_staff_id = NULL WHERE picked_up_by_staff_id = $1', [id]);
    await client.query('UPDATE food_requests SET received_at_hub_by_staff_id = NULL WHERE received_at_hub_by_staff_id = $1', [id]);
    await client.query('UPDATE users SET parent_ngo_id = NULL WHERE parent_ngo_id = $1', [id]);

    // 9. Finally delete the user
    const deleteRes = await client.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email, role', [id]);

    await client.query('COMMIT');
    return deleteRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createUser,
  findById,
  findByPhone,
  findByEmail,
  findByPhoneOrEmail,
  findByRole,
  updateVerificationStatus,
  updateUserProfile,
  updateLastLogin,
  updateLastActive,
  deleteUserById
};
