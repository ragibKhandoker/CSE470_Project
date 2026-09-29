const path = require('path');
const { Pool } = require('pg');

// Ensure environment variables are loaded from server/.env
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

let activeUrl = (process.env.DATABASE_URL || '').trim();

if (!activeUrl) {
  console.error('❌ ERROR: DATABASE_URL is not defined in environment variables.');
  console.error('👉 Please configure DATABASE_URL in server/.env file.');
  process.exit(1);
}

const createPool = (connString) => {
  const p = new Pool({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 7000,
    max: 20
  });

  p.on('connect', () => {
    // Database connection active
  });

  p.on('error', (err) => {
    console.error('Database pool error:', err.message);
  });

  return p;
};

let currentPool = createPool(activeUrl);

const getAlternatePortUrl = (url) => {
  if (!url) return null;
  if (url.includes(':5432/')) {
    return url.replace(':5432/', ':6543/');
  }
  if (url.includes(':6543/')) {
    return url.replace(':6543/', ':5432/');
  }
  return null;
};

const isConnectionError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';
  return (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    msg.includes('timeout') ||
    msg.includes('connection refused') ||
    msg.includes('network')
  );
};

const query = async (text, params) => {
  try {
    return await currentPool.query(text, params);
  } catch (err) {
    if (isConnectionError(err)) {
      const alternateUrl = getAlternatePortUrl(activeUrl);
      if (alternateUrl && alternateUrl !== activeUrl) {
        console.warn(
          `⚠️ [DB Auto-Recovery] Primary connection failed (${err.message}). Retrying on alternate Supabase pooler port...`
        );
        try {
          const fallbackPool = createPool(alternateUrl);
          const result = await fallbackPool.query(text, params);
          // If fallback succeeded, make it the active pool permanently
          const oldPool = currentPool;
          currentPool = fallbackPool;
          activeUrl = alternateUrl;
          console.log('✅ [DB Auto-Recovery] Reconnected successfully to cloud database on alternate port!');
          try {
            oldPool.end();
          } catch (e) {}
          return result;
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
    }
    throw err;
  }
};

module.exports = {
  query,
  get pool() {
    return currentPool;
  }
};
