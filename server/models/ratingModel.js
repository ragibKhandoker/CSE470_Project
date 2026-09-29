const db = require('../config/db');

/**
 * Rating Model - database operations for ratings table
 */

const createRating = async ({ author_id, target_user_id, score, comment, food_name = null, food_post_id = null }) => {
  const query = `
    INSERT INTO ratings (author_id, target_user_id, score, comment, food_name, food_post_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const result = await db.query(query, [author_id, target_user_id, score, comment, food_name, food_post_id]);
  return result.rows[0];
};

const findById = async (id) => {
  const query = `
    SELECT r.*, 
           COALESCE(n.organization_name, u.name) AS target_name, 
           a.name AS author_name,
           u.role AS target_role
    FROM ratings r
    JOIN users u ON r.target_user_id = u.id
    LEFT JOIN ngos n ON n.user_id = u.id
    JOIN users a ON r.author_id = a.id
    WHERE r.id = $1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const findByTargetUserId = async (targetUserId) => {
  const query = `
    SELECT r.*, u.name AS author_name, u.role AS author_role
    FROM ratings r
    JOIN users u ON r.author_id = u.id
    WHERE r.target_user_id = $1
    ORDER BY r.created_at DESC;
  `;
  const result = await db.query(query, [targetUserId]);
  return result.rows;
};

const findByAuthorId = async (authorId) => {
  const query = `
    SELECT r.*, 
           COALESCE(n.organization_name, u.name) AS target_name, 
           u.role AS target_role,
           r.food_name,
           r.food_post_id
    FROM ratings r
    JOIN users u ON r.target_user_id = u.id
    LEFT JOIN ngos n ON n.user_id = u.id
    WHERE r.author_id = $1
    ORDER BY r.created_at DESC;
  `;
  const result = await db.query(query, [authorId]);
  return result.rows;
};

const updateRating = async (id, { score, comment }) => {
  const query = `
    UPDATE ratings
    SET score = COALESCE($1, score),
        comment = COALESCE($2, comment)
    WHERE id = $3
    RETURNING *;
  `;
  const result = await db.query(query, [score, comment, id]);
  return result.rows[0];
};

const deleteRating = async (id) => {
  const query = `DELETE FROM ratings WHERE id = $1 RETURNING *;`;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  createRating,
  findById,
  findByTargetUserId,
  findByAuthorId,
  updateRating,
  deleteRating
};
