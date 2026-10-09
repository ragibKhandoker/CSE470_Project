ALTER TABLE public.food_posts
  ADD COLUMN IF NOT EXISTS receiver_price_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.food_requests
  ADD COLUMN IF NOT EXISTS purchase_price_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.receiver_cart_items (
  id BIGSERIAL PRIMARY KEY,
  receiver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_post_id INTEGER NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (receiver_id, food_post_id)
);

CREATE TABLE IF NOT EXISTS public.receiver_wishlist_items (
  id BIGSERIAL PRIMARY KEY,
  receiver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_post_id INTEGER NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (receiver_id, food_post_id)
);
