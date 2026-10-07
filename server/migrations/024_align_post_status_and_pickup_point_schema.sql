ALTER TYPE food_post_status ADD VALUE IF NOT EXISTS 'at_ngo_point';
ALTER TYPE food_post_status ADD VALUE IF NOT EXISTS 'distributed';

ALTER TABLE public.pickup_points
  ADD COLUMN IF NOT EXISTS ngo_id INTEGER REFERENCES public.ngos(id) ON DELETE CASCADE;
