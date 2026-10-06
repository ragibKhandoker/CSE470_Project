const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ALGORITHM = 'aes-256-cbc';

// Guarantee exactly 32 bytes (256 bits) for AES-256 using SHA-256 hash of secret
const getSecretKey = () => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not defined in server/.env.');
  }
  return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * AES-256 Encryption Helper for sensitive database fields (e.g. NID, Anonymous receiver names)
 * Format: <iv_hex>:<ciphertext_hex>
 */
const encrypt = (text) => {
  if (text === null || text === undefined || text === '') return text;
  try {
    const stringText = String(text);
    // If already encrypted (starts with 32 hex chars followed by colon), don't double encrypt
    if (/^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(stringText)) {
      return stringText;
    }
    const iv = crypto.randomBytes(16);
    const key = getSecretKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(stringText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.warn('⚠️ [AES-256] Encryption error:', err.message);
    return text;
  }
};

/**
 * AES-256 Decryption Helper
 */
const decrypt = (text) => {
  if (!text || typeof text !== 'string' || !text.includes(':')) return text;
  try {
    const parts = text.split(':');
    if (parts.length !== 2 || parts[0].length !== 32) return text;
    const iv = Buffer.from(parts[0], 'hex');
    const key = getSecretKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If not a valid ciphertext or key mismatch, return original text safely
    return text;
  }
};

/**
 * Helper to decrypt specified fields in an object
 */
const decryptFields = (obj, fields = ['nid']) => {
  if (!obj || typeof obj !== 'object') return obj;
  const cloned = { ...obj };
  fields.forEach(field => {
    if (cloned[field]) {
      cloned[field] = decrypt(cloned[field]);
    }
  });
  return cloned;
};

/**
 * Helper to encrypt specified fields in an object
 */
const encryptFields = (obj, fields = ['nid']) => {
  if (!obj || typeof obj !== 'object') return obj;
  const cloned = { ...obj };
  fields.forEach(field => {
    if (cloned[field]) {
      cloned[field] = encrypt(cloned[field]);
    }
  });
  return cloned;
};

module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields
};
