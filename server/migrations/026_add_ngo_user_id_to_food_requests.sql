-- Migration 026: Add ngo_user_id to food_requests for tracking payments and assigned NGOs
ALTER TABLE public.food_requests
  ADD COLUMN IF NOT EXISTS ngo_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL;

