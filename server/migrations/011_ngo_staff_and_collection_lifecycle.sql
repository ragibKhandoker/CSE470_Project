-- Migration 011: NGO Staff Roles & Collection Lifecycle Tracking

-- 1. Add NGO Staff sub-roles and parent NGO link to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ngo_staff_role VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parent_ngo_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add collection & distribution tracking columns to food_requests
ALTER TABLE food_requests
ADD COLUMN IF NOT EXISTS assigned_staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS picked_up_by_staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS received_at_hub_by_staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS received_at_hub_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS distributed_pickup_point_id INTEGER REFERENCES pickup_points(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS total_packets INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS remaining_packets INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS distribution_logs JSONB DEFAULT '[]'::jsonb;

-- 3. Add pickup point and needs options to food_posts
ALTER TABLE food_posts
ADD COLUMN IF NOT EXISTS pickup_point_id INTEGER REFERENCES pickup_points(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS needs_options TEXT[] DEFAULT '{}'::TEXT[];
