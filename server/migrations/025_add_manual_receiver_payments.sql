ALTER TABLE public.food_posts
  ADD COLUMN IF NOT EXISTS distribution_total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distribution_total_packets INTEGER,
  ADD COLUMN IF NOT EXISTS distribution_bkash_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS distribution_ngo_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.food_requests
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS bkash_transaction_id VARCHAR(40),
  ADD COLUMN IF NOT EXISTS payment_bkash_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;
