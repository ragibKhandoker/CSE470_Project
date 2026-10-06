-- Migration 016: Create password reset requests table and enhance notifications

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identifier VARCHAR(255) NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  reset_token VARCHAR(255),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by INT REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_token ON password_reset_requests(reset_token);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_status ON password_reset_requests(status);

-- Enhance notifications table with type, link, and metadata columns if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'general';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'link'
  ) THEN
    ALTER TABLE notifications ADD COLUMN link VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB;
  END IF;
END $$;
