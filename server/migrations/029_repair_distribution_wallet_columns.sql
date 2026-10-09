ALTER TABLE public.food_posts
  ADD COLUMN IF NOT EXISTS distribution_bkash_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS distribution_rocket_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS distribution_nagad_number VARCHAR(20);
