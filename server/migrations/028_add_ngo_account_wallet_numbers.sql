ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ngo_bkash_wallet_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ngo_rocket_wallet_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ngo_nagad_wallet_number VARCHAR(20);
