const db = require('../config/db');

/**
 * Notification Model - database operations for notifications table
 */

const createNotification = async (notificationData) => {
  const { user_id, message, title = null } = notificationData;
  const query = `
    INSERT INTO notifications (user_id, title, message)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await db.query(query, [user_id, title, message]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query(
    'SELECT * FROM notifications WHERE id = $1;',
    [id]
  );
  return result.rows[0];
};

const findByUserId = async (userId) => {
  const result = await db.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC;`,
    [userId]
  );
  return result.rows;
};

const markAsRead = async (id, userId) => {
  const result = await db.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *;`,
    [id, userId]
  );
  return result.rows[0];
};

const markAllAsRead = async (userId) => {
  const result = await db.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE
     RETURNING id;`,
    [userId]
  );
  return result.rows;
};

const deleteNotification = async (id, userId) => {
  const result = await db.query(
    `DELETE FROM notifications
     WHERE id = $1 AND user_id = $2
     RETURNING *;`,
    [id, userId]
  );
  return result.rows[0];
};

module.exports = {
  createNotification,
  findById,
  findByUserId,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
