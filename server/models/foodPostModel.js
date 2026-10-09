const db = require('../config/db');

/**
 * Food Post Model - database operations for food_posts table
 */

const createFoodPost = async ({
  donor_id,
  food_name,
  title,
  food_type,
  quantity,
  expiry_time,
  district,
  thana,
  area_ward,
  road_no,
  house_no,
  floor_flat,
  latitude,
  longitude,
  image_url,
  notes,
  status = 'available'
}) => {
  const finalFoodName = food_name || title || null;
  const finalTitle = title || food_name || null;
  const pickupAddress = [floor_flat, house_no, road_no, area_ward, thana, district]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim())
    .join(', ');
  const query = `
    INSERT INTO food_posts
    (
      donor_id,
      food_name,
      title,
      pickup_address,
      food_type,
      quantity,
      expiry_time,
      district,
      thana,
      area_ward,
      road_no,
      house_no,
      floor_flat,
      latitude,
      longitude,
      image_url,
      notes,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *;
  `;
  const values = [
    donor_id,
    finalFoodName,
    finalTitle,
    pickupAddress,
    food_type,
    quantity,
    expiry_time,
    district || null,
    thana || null,
    area_ward || null,
    road_no || null,
    house_no || null,
    floor_flat || null,
    latitude ? parseFloat(latitude) : null,
    longitude ? parseFloat(longitude) : null,
    image_url || null,
    notes || null,
    status
  ];
  const result = await db.query(query, values);
  return result.rows[0];
};

const getAllFoodPosts = async (donorId = null) => {
  let query = `
    SELECT 
      f.*,
      u.name AS donor_name,
      u.phone AS donor_phone,
      u.role AS donor_role,
      ngo.organization_name AS ngo_organization_name,
      fr.status AS pickup_status,
      fr.assigned_staff_id,
      staff.name AS assigned_staff_name,
      picked_staff.name AS picked_up_staff_name,
      hub_staff.name AS hub_staff_name,
      pp.name AS pickup_point_name,
      fr.total_packets,
      fr.remaining_packets
    FROM food_posts f
    LEFT JOIN users u ON f.donor_id = u.id
    LEFT JOIN ngos ngo ON ngo.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT fr_sub.* FROM food_requests fr_sub
      JOIN users u_ngo ON fr_sub.receiver_id = u_ngo.id
      WHERE fr_sub.food_post_id = f.id 
        AND u_ngo.role = 'ngo'
        AND fr_sub.status IN ('pickup_requested', 'approved', 'assigned', 'picked_up', 'at_hub', 'distributing', 'distributed')
      ORDER BY fr_sub.id DESC LIMIT 1
    ) fr ON true
    LEFT JOIN users staff ON fr.assigned_staff_id = staff.id
    LEFT JOIN users picked_staff ON fr.picked_up_by_staff_id = picked_staff.id
    LEFT JOIN users hub_staff ON fr.received_at_hub_by_staff_id = hub_staff.id
    LEFT JOIN pickup_points pp ON fr.distributed_pickup_point_id = pp.id
  `;
  const values = [];
  if (donorId) {
    query += ` WHERE f.donor_id = $1 `;
    values.push(donorId);
  }
  query += ` ORDER BY f.id DESC;`;
  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Get only food posts posted by NGO users (role = 'ngo') or active at NGO point.
 * Receivers should only see these, not individual donor posts.
 * Includes live remaining_packets from the NGO distribution request.
 */
const getAllNgoPosts = async () => {
  const query = `
    SELECT 
      f.*,
      u.name AS donor_name,
      u.phone AS donor_phone,
      u.role AS donor_role,
      ngo.organization_name AS ngo_organization_name,
      pp.name AS pickup_point_name,
      pp.address AS pickup_point_address,
      fr.remaining_packets,
      fr.total_packets
    FROM food_posts f
    LEFT JOIN users u ON f.donor_id = u.id
    LEFT JOIN ngos ngo ON ngo.user_id = u.id
    LEFT JOIN pickup_points pp ON f.pickup_point_id = pp.id
    LEFT JOIN LATERAL (
      SELECT fr_ngo.remaining_packets, fr_ngo.total_packets, fr_ngo.receiver_id
      FROM food_requests fr_ngo
      JOIN users u_ngo ON fr_ngo.receiver_id = u_ngo.id
      WHERE fr_ngo.food_post_id = f.id AND u_ngo.role = 'ngo'
      ORDER BY fr_ngo.id DESC LIMIT 1
    ) fr ON true
    WHERE (u.role = 'ngo' OR f.status::text IN ('at_ngo_point'))
      AND f.status != 'completed'
      AND (fr.remaining_packets IS NULL OR fr.remaining_packets > 0)
    ORDER BY f.id DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};

/**
 * Get all donor posts (role = 'donor') for NGO consumption.
 * NGOs browse these to find food to pick up.
 * Excludes posts that this NGO has already requested pickup for.
 */
const getAllDonorPosts = async (excludeNgoUserId = null) => {
  let query = `
    SELECT 
      f.*,
      u.name AS donor_name,
      u.phone AS donor_phone,
      u.role AS donor_role,
      ngo.organization_name AS ngo_organization_name
    FROM food_posts f
    LEFT JOIN users u ON f.donor_id = u.id
    LEFT JOIN ngos ngo ON ngo.user_id = u.id
    WHERE u.role = 'donor'
      AND f.status = 'available'
  `;
  const values = [];
  if (excludeNgoUserId) {
    query += `
      AND f.id NOT IN (
        SELECT food_post_id FROM food_requests
        WHERE (receiver_id = $1 OR receiver_id = (SELECT parent_ngo_id FROM users WHERE id = $1))
          AND status IN ('pickup_requested', 'approved', 'assigned', 'picked_up', 'at_hub', 'distributing', 'distributed')
      )
    `;
    values.push(excludeNgoUserId);
  }
  query += ` ORDER BY f.id DESC;`;
  const result = await db.query(query, values);
  return result.rows;
};

const getFoodPostById = async (id) => {
  const query = `
    SELECT 
      f.*,
      COALESCE(f.distribution_ngo_user_id, responsible_ngo.receiver_id, CASE WHEN u.role = 'ngo' THEN u.id END) AS distribution_ngo_user_id,
      u.name AS donor_name,
      u.phone AS donor_phone,
      u.role AS donor_role,
      ngo.organization_name AS ngo_organization_name
    FROM food_posts f
    LEFT JOIN users u ON f.donor_id = u.id
    LEFT JOIN ngos ngo ON ngo.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT fr.receiver_id
      FROM food_requests fr
      JOIN users request_ngo ON request_ngo.id = fr.receiver_id AND request_ngo.role = 'ngo'
      WHERE fr.food_post_id = f.id
        AND fr.status IN ('pickup_requested', 'approved', 'assigned', 'picked_up', 'at_hub', 'distributing', 'distributed')
      ORDER BY fr.id DESC
      LIMIT 1
    ) responsible_ngo ON true
    WHERE f.id = $1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updateFoodPost = async (id, {
  food_name,
  title,
  food_type,
  quantity,
  expiry_time,
  district,
  thana,
  area_ward,
  road_no,
  house_no,
  floor_flat,
  latitude,
  longitude,
  image_url,
  status
}) => {
  const finalFoodName = food_name || title;
  const finalTitle = title || food_name;
  const query = `
    UPDATE food_posts 
    SET 
      food_name = COALESCE($1, food_name),
      title = COALESCE($2, title),
      food_type = COALESCE($3, food_type), 
      quantity = COALESCE($4, quantity), 
      expiry_time = COALESCE($5, expiry_time), 
      district = COALESCE($6, district),
      thana = COALESCE($7, thana),
      area_ward = COALESCE($8, area_ward),
      road_no = COALESCE($9, road_no),
      house_no = COALESCE($10, house_no),
      floor_flat = COALESCE($11, floor_flat),
      latitude = COALESCE($12, latitude), 
      longitude = COALESCE($13, longitude),
      image_url = COALESCE($14, image_url),
      status = COALESCE($15, status)
    WHERE id = $16
    RETURNING *;
  `;
  const values = [
    finalFoodName || null,
    finalTitle || null,
    food_type,
    quantity,
    expiry_time,
    district,
    thana,
    area_ward,
    road_no,
    house_no,
    floor_flat,
    latitude ? parseFloat(latitude) : null,
    longitude ? parseFloat(longitude) : null,
    image_url,
    status,
    id
  ];
  const result = await db.query(query, values);
  return result.rows[0];
};

const deleteFoodPost = async (id) => {
  const query = `
    DELETE FROM food_posts 
    WHERE id = $1 
    RETURNING *;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  createFoodPost,
  getAllFoodPosts,
  getAllNgoPosts,
  getAllDonorPosts,
  getFoodPostById,
  updateFoodPost,
  deleteFoodPost
};
