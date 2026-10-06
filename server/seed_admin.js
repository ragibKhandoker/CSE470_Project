const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config(); // also fallback to root .env if present
const { query, pool } = require('./config/db');
let bcrypt;
try { bcrypt = require('bcrypt'); } catch(e) { bcrypt = require('bcryptjs'); }

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function seedAdmin() {
  try {
    let email = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim();
    let password = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!email) {
      email = await prompt('Enter Super Admin Email: ');
    }
    if (!password) {
      password = await prompt('Enter Super Admin Password: ');
    }

    if (!email || !password) {
      console.error('❌ Error: Both email and password are required.');
      process.exit(1);
    }

    const passHash = await bcrypt.hash(password, 10);
    const existing = await query('SELECT id, email, role FROM public.users WHERE email = $1', [email]);
    
    if (existing.rows.length === 0) {
      await query(
        'INSERT INTO public.users (name, phone, email, password_hash, role, verification_status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Super Admin', '01700000000', email, passHash, 'admin', 'verified']
      );
      console.log(`✅ Super Admin account (${email}) created successfully.`);
    } else {
      await query(
        'UPDATE public.users SET role = $1, verification_status = $2, password_hash = $3 WHERE email = $4',
        ['admin', 'verified', passHash, email]
      );
      console.log(`✅ Super Admin account (${email}) updated successfully.`);
    }
  } catch (err) {
    console.error('Seed Error:', err);
  } finally {
    await pool.end();
  }
}

seedAdmin();
