-- Migration 018: Create bot_alerts and platform_settings tables

CREATE TABLE IF NOT EXISTS bot_alerts (
  id SERIAL PRIMARY KEY,
  account_id INT REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  risk_level VARCHAR(50) NOT NULL,
  risk_color VARCHAR(50),
  risk_bg VARCHAR(50),
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  telemetry JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bot alerts table created cleanly without static dummy placeholders

-- Seed initial general platform settings
INSERT INTO platform_settings (key, value, updated_at)
VALUES (
  'general',
  '{"platformName": "ShareMeal", "supportEmail": "support@sharemeal.org", "requireNidForReceivers": true, "maxRequestsPerHour": 10}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;
