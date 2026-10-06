const db = require('../config/db');

/**
 * NGO Staff Model - database operations for NGO staff management
 */

// List all staff members belonging to an NGO (NEVER return passwords)
const getStaffByParentNgo = async (parentNgoId, isAdmin = false) => {
  let query = `
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.phone, 
      u.role, 
      u.ngo_staff_role, 
      u.parent_ngo_id, 
      u.address,
      u.nid,
      u.nid_pdf,
      u.verification_status, 
      u.created_at,
      COUNT(DISTINCT fr_assigned.id) AS total_assigned_pickups,
      COUNT(DISTINCT fr_picked.id) AS total_completed_pickups,
      COUNT(DISTINCT fr_hub.id) AS total_hub_verifications
    FROM users u
    LEFT JOIN food_requests fr_assigned ON fr_assigned.assigned_staff_id = u.id
    LEFT JOIN food_requests fr_picked ON fr_picked.picked_up_by_staff_id = u.id
    LEFT JOIN food_requests fr_hub ON fr_hub.received_at_hub_by_staff_id = u.id
  `;
  const params = [];
  if (!isAdmin) {
    params.push(parentNgoId);
    query += ` WHERE u.parent_ngo_id = $1 `;
  } else {
    // If admin, show staff of specified NGO or any staff with an ngo_staff_role
    if (parentNgoId) {
      params.push(parentNgoId);
      query += ` WHERE (u.parent_ngo_id = $1 OR u.ngo_staff_role IS NOT NULL) `;
    } else {
      query += ` WHERE u.ngo_staff_role IS NOT NULL `;
    }
  }
  query += `
    GROUP BY u.id
    ORDER BY u.created_at DESC;
  `;
  const result = await db.query(query, params);
  return result.rows;
};

// Create a new staff member under the NGO admin
const createStaffMember = async ({
  name,
  phone,
  email,
  address,
  nid,
  password_hash,
  plain_password,
  ngo_staff_role,
  parent_ngo_id
}) => {
  const query = `
    INSERT INTO users (
      name, 
      phone, 
      email, 
      address,
      nid,
      password_hash, 
      plain_password, 
      role, 
      ngo_staff_role, 
      parent_ngo_id,
      verification_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'ngo', $8, $9, 'verified')
    RETURNING id, name, phone, email, address, nid, role, ngo_staff_role, parent_ngo_id, verification_status, created_at;
  `;
  const values = [
    name,
    phone,
    email || null,
    address || null,
    nid || null,
    password_hash,
    plain_password,
    ngo_staff_role,
    parent_ngo_id
  ];
  const result = await db.query(query, values);
  return result.rows[0];
};

// Update an existing staff member's info
const updateStaffMember = async (staffId, parentNgoId, { name, phone, email, address, nid, ngo_staff_role }, isAdmin = false) => {
  let query = `
    UPDATE users
    SET
      name = COALESCE($1, name),
      phone = COALESCE($2, phone),
      email = COALESCE($3, email),
      address = COALESCE($4, address),
      nid = COALESCE($5, nid),
      ngo_staff_role = COALESCE($6, ngo_staff_role)
    WHERE id = $7
  `;
  const values = [name || null, phone || null, email || null, address || null, nid || null, ngo_staff_role || null, staffId];
  if (!isAdmin) {
    values.push(parentNgoId);
    query += ` AND parent_ngo_id = $8 `;
  }
  query += ` RETURNING id, name, phone, email, address, nid, role, ngo_staff_role, parent_ngo_id, verification_status, created_at;`;
  const result = await db.query(query, values);
  return result.rows[0];
};

// Delete / remove a staff member
const deleteStaffMember = async (staffId, parentNgoId, isAdmin = false) => {
  let query = `
    DELETE FROM users
    WHERE id = $1
  `;
  const values = [staffId];
  if (!isAdmin) {
    values.push(parentNgoId);
    query += ` AND parent_ngo_id = $2 `;
  }
  query += ` RETURNING id, name, phone, email, ngo_staff_role;`;
  const result = await db.query(query, values);
  return result.rows[0];
};

module.exports = {
  getStaffByParentNgo,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember
};
