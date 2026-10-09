const db = require('../config/db');

const getMine = async (userId) => {
  const [balance, history] = await Promise.all([
    db.query('SELECT points_balance FROM users WHERE id = $1', [userId]),
    db.query(`SELECT id, request_id, kind, points, taka_value, note, created_at
      FROM points_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`, [userId])
  ]);
  return { balance: balance.rows[0]?.points_balance || '0.00', transactions: history.rows };
};

const getReceiverBalances = async () => {
  const result = await db.query(`SELECT id, name, phone, points_balance
    FROM users WHERE role = 'receiver' ORDER BY name ASC`);
  return result.rows;
};

const grant = async ({ receiverId, adminId, points, note }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(`UPDATE users SET points_balance = points_balance + $1
      WHERE id = $2 AND role = 'receiver' RETURNING id, points_balance`, [points, receiverId]);
    if (!updated.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query(`INSERT INTO points_transactions (user_id, actor_id, kind, points, taka_value, note)
      VALUES ($1, $2, 'credit', $3, $3, $4)`, [receiverId, adminId, points, note]);
    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
};

module.exports = { getMine, getReceiverBalances, grant };
