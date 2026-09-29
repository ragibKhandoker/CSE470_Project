-- Migration 013: Add last_login and last_active_at to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Initialize existing users' last_active_at to their created_at if null
UPDATE users 
SET last_active_at = created_at 
WHERE last_active_at IS NULL AND created_at IS NOT NULL;

