-- Migration 019: AES-256 Field-Level Database Encryption for Sensitive Identity Data (PII)
-- CSE470 Sprint 3 Item 4: Data Encryption for Identity Fields (AES-256)

-- 1. Ensure NID column in users table can accommodate AES-256 ciphertext (<iv_hex>:<cipher_hex>)
ALTER TABLE users ALTER COLUMN nid TYPE TEXT;

-- 2. Document AES-256 encryption for sensitive receiver notes and identity fields
COMMENT ON COLUMN users.nid IS 'AES-256 CBC encrypted national identity number (Format: iv_hex:ciphertext_hex)';
COMMENT ON COLUMN food_requests.notes IS 'Optional delivery notes, encrypted with AES-256 when is_anonymous is active';
