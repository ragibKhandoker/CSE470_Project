require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL is not defined.');
  console.error('👉 If running in GitHub Actions, add DATABASE_URL in Settings -> Secrets and variables -> Actions.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

console.log('🔄 Connecting to Supabase PostgreSQL database...');

pool.query('SELECT NOW() AS ping_time, count(*) AS total_posts FROM food_posts;', (err, res) => {
  if (err) {
    console.error('❌ Keep-alive query failed:', err.message);
    pool.end();
    process.exit(1);
  }

  console.log('✅ Supabase Keep-Alive successful!');
  console.log('🕒 Server Timestamp:', res.rows[0].ping_time);
  console.log('📊 Active Food Posts in DB:', res.rows[0].total_posts);
  console.log('🎉 7-day Supabase inactivity timer has been successfully reset.');
  pool.end();
  process.exit(0);
});
