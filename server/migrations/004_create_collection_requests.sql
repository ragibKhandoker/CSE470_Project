-- Create Collection Requests Table (NGO claiming donor food post)
CREATE TABLE IF NOT EXISTS collection_requests (
    id SERIAL PRIMARY KEY,
    food_post_id INTEGER NOT NULL REFERENCES food_posts(id) ON DELETE CASCADE,
    ngo_id INTEGER NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, completed
    pickup_code VARCHAR(10),
    collected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
