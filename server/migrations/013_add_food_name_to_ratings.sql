-- Add food_name and food_post_id to ratings table for meal feedback tracking
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS food_name VARCHAR(255);
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS food_post_id INTEGER;
