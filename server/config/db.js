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

const initializeDatabase = async () => {
  try {
    // Wallet-backed queries need these columns on every database, including
    // databases where the historical wallet migration was never applied.
    await query(`
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS ngo_bkash_wallet_number VARCHAR(20),
        ADD COLUMN IF NOT EXISTS ngo_rocket_wallet_number VARCHAR(20),
        ADD COLUMN IF NOT EXISTS ngo_nagad_wallet_number VARCHAR(20)
    `);
    await query(`
      ALTER TABLE public.food_posts
        ADD COLUMN IF NOT EXISTS distribution_bkash_number VARCHAR(20),
        ADD COLUMN IF NOT EXISTS distribution_rocket_number VARCHAR(20),
        ADD COLUMN IF NOT EXISTS distribution_nagad_number VARCHAR(20)
    `);

    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'pickup_points'
        ) THEN
          ALTER TABLE public.pickup_points
            ADD COLUMN IF NOT EXISTS ngo_id INTEGER REFERENCES public.ngos(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Run schema changes separately so a failure in one check cannot prevent
    // the wallet columns required by food request queries from being created.
    await query(`ALTER TYPE public.food_post_status ADD VALUE IF NOT EXISTS 'at_ngo_point'`);
    await query(`ALTER TYPE public.food_post_status ADD VALUE IF NOT EXISTS 'distributed'`);

    console.log('✅ [DB Schema] Critical schema check completed.');
  } catch (error) {
    console.warn('⚠️ [DB Schema] Critical schema alignment skipped:', error.message);
  }
};

module.exports = {
  query,
  initializeDatabase,
  get pool() {
    return currentPool;
  }
};
