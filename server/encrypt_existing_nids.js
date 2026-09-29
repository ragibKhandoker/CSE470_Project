require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');
const { encrypt, decrypt } = require('./utils/encryption');

async function migrateNidsToAES256() {
  console.log('🔒 Starting AES-256 database migration for sensitive identity fields (NID)...');
  try {
    const res = await db.query("SELECT id, name, nid FROM users WHERE nid IS NOT NULL AND nid != '';");
    let encryptedCount = 0;
    let alreadyEncryptedCount = 0;

    for (const user of res.rows) {
      const originalNid = user.nid.trim();
      // Check if already in AES-256 <iv_hex>:<ciphertext_hex> format
      if (/^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(originalNid)) {
        alreadyEncryptedCount++;
        continue;
      }

      const encryptedNid = encrypt(originalNid);
      await db.query('UPDATE users SET nid = $1 WHERE id = $2', [encryptedNid, user.id]);
      
      // Verification test
      const testDecrypted = decrypt(encryptedNid);
      if (testDecrypted !== originalNid) {
        throw new Error(`Integrity check failed for user ${user.id}: ${testDecrypted} !== ${originalNid}`);
      }

      encryptedCount++;
      console.log(`  ✔ [User ID ${user.id}: ${user.name}] Encrypted plaintext NID -> ${encryptedNid.slice(0, 37)}...`);
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`   - Encrypted new records: ${encryptedCount}`);
    console.log(`   - Already encrypted records: ${alreadyEncryptedCount}`);
    console.log(`   - Total verified: ${res.rows.length}`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrateNidsToAES256();
