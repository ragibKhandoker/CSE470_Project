-- Create Enum type for Food Post Status
CREATE TYPE food_post_status AS ENUM ('available', 'reserved', 'collected', 'completed', 'expired');

-- Create Food Posts Table
CREATE TABLE IF NOT EXISTS food_posts (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quantity VARCHAR(100) NOT NULL,
    food_type VARCHAR(100),
    pickup_address TEXT NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status food_post_status DEFAULT 'available',
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
