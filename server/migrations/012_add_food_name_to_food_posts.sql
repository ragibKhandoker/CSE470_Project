-- Migration 012: Add food_name and title to food_posts
ALTER TABLE food_posts 
ADD COLUMN IF NOT EXISTS food_name VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT NULL;
