const db = require('../config/db');

const createMessage = async ({ sender_id, receiver_id, food_post_id = null, message_text }) => {
  const result = await db.query(
    `INSERT INTO messages (sender_id, receiver_id, food_post_id, message_text)
     VALUES ($1, $2, $3, $4)
     RETURNING *;`,
    [sender_id, receiver_id, food_post_id, message_text.trim()]
  );
  return result.rows[0];
};

const createAdminMessage = async ({ sender_id, receiver_id, receiver_role, message_text }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const messageResult = await client.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text)
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [sender_id, receiver_id, message_text]
    );
    const message = messageResult.rows[0];
    const link = receiver_role === 'donor' ? '/donor/notifications' : '/receiver/notifications';

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb);`,
      [
        receiver_id,
        'Message from ShareMeal Admin',
        'The admin team sent you a message. Open notifications to read it.',
        'admin_message',
        link,
        JSON.stringify({ message_id: message.id })
      ]
    );

    await client.query('COMMIT');
    return message;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const findConversation = async (userId, otherUserId, foodPostId = null) => {
  const result = await db.query(
    `SELECT id, sender_id, receiver_id, food_post_id, message_text, sent_at
     FROM messages
     WHERE ((sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1))
       AND ($3::INTEGER IS NULL OR food_post_id = $3)
     ORDER BY sent_at ASC, id ASC;`,
    [userId, otherUserId, foodPostId]
  );
  return result.rows;
};

const findAdminMessagesForUser = async (userId) => {
  const result = await db.query(
    `SELECT m.id, m.sender_id, u.name AS sender_name, m.message_text, m.sent_at
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.receiver_id = $1
       AND u.role::text IN ('admin', 'super_admin')
     ORDER BY m.sent_at DESC, m.id DESC
     LIMIT 50;`,
    [userId]
  );
  return result.rows;
};

module.exports = { createMessage, createAdminMessage, findConversation, findAdminMessagesForUser };