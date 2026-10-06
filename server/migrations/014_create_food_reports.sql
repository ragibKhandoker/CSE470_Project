-- Migration 014: Create food_reports table
CREATE TABLE IF NOT EXISTS food_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_request_id INTEGER REFERENCES food_requests(id) ON DELETE SET NULL,
    food_post_id INTEGER REFERENCES food_posts(id) ON DELETE SET NULL,
    donor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    food_name VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255),
    reason VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, investigating, resolved, dismissed
    admin_notes TEXT,
    action_taken VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_food_reports_reporter ON food_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_food_reports_status ON food_reports(status);
CREATE INDEX IF NOT EXISTS idx_food_reports_food_post ON food_reports(food_post_id);
CREATE INDEX IF NOT EXISTS idx_food_reports_food_request ON food_reports(food_request_id);
