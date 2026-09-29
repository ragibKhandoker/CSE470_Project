-- Migration 015: Add proof_image_url to food_reports table
ALTER TABLE food_reports ADD COLUMN IF NOT EXISTS proof_image_url TEXT;
