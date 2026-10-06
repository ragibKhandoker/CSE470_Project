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

module.exports = { createMessage, findConversation };