-- Replace manual wallet/transaction-ID payment records with an internal points ledger.
DROP TABLE IF EXISTS public.payments CASCADE;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS points_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.food_requests
  DROP COLUMN IF EXISTS bkash_transaction_id,
  DROP COLUMN IF EXISTS payment_bkash_number,
  DROP COLUMN IF EXISTS payment_verified_at;

CREATE TABLE IF NOT EXISTS public.points_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_id INTEGER REFERENCES public.food_requests(id) ON DELETE SET NULL,
  actor_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  kind VARCHAR(12) NOT NULL CHECK (kind IN ('credit', 'debit')),
  points NUMERIC(12, 2) NOT NULL CHECK (points > 0),
  taka_value NUMERIC(12, 2) NOT NULL CHECK (taka_value >= 0),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS points_transactions_one_request_debit
  ON public.points_transactions(request_id)
  WHERE kind = 'debit' AND request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS points_transactions_user_created_idx
  ON public.points_transactions(user_id, created_at DESC);
