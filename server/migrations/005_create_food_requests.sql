-- Create Food Requests Table (Receiver requesting food from Food Posts)
CREATE TABLE IF NOT EXISTS food_requests (
    id SERIAL PRIMARY KEY,
    food_post_id INTEGER NOT NULL REFERENCES food_posts(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    pickup_code VARCHAR(20) UNIQUE NOT NULL,
    requested_quantity INT DEFAULT 1,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'requested', -- requested, approved, fulfilled, rejected, cancelled
    receipt_photo_url TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

