const db = require('../config/db');

/**
 * PickupPoint Model - database operations for pickup_points table
 */

const getAll = async (ngoId = null) => {
  let query = `
    SELECT 
      pp.*,
      ngo.organization_name
    FROM pickup_points pp
    LEFT JOIN ngos ngo ON pp.ngo_id = ngo.id
  `;
  const values = [];
  if (ngoId) {
    query += ` WHERE pp.ngo_id = $1 `;
    values.push(ngoId);
  }
  query += ` ORDER BY pp.id DESC;`;
  const result = await db.query(query, values);
  return result.rows;
};

const getById = async (id) => {
  const query = `
    SELECT 
      pp.*,
      ngo.organization_name
    FROM pickup_points pp
    LEFT JOIN ngos ngo ON pp.ngo_id = ngo.id
    WHERE pp.id = $1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const create = async ({
  ngo_id,
  name,
  address,
  operating_hours = '8 AM – 9 PM',
  active_items = 0,
  status = 'Active'
}) => {
  const query = `
    INSERT INTO pickup_points (
      ngo_id,
      name,
      address,
      operating_hours,
      active_items,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    ngo_id,
    name,
    address,
    operating_hours,
    active_items,
    status
  ];
  const result = await db.query(query, values);
  return result.rows[0];
};

const update = async (id, {
  name,
  address,
  operating_hours,
  active_items,
  status
}) => {
  const query = `
    UPDATE pickup_points
    SET
      name = COALESCE($1, name),
      address = COALESCE($2, address),
      operating_hours = COALESCE($3, operating_hours),
      active_items = COALESCE($4, active_items),
      status = COALESCE($5, status)
    WHERE id = $6
    RETURNING *;
  `;
  const values = [name, address, operating_hours, active_items, status, id];
  const result = await db.query(query, values);
  return result.rows[0];
};

const toggleStatus = async (id) => {
  const query = `
    UPDATE pickup_points
    SET status = CASE WHEN status = 'Active' THEN 'Inactive' ELSE 'Active' END
    WHERE id = $1
    RETURNING *;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const deleteById = async (id) => {
  const query = `DELETE FROM pickup_points WHERE id = $1 RETURNING *;`;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  toggleStatus,
  deleteById
};
