ALTER TABLE public.ngos
  ADD COLUMN IF NOT EXISTS registration_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS registration_document_pdf BYTEA,
  ADD COLUMN IF NOT EXISTS verified_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.ngos
SET registration_no = registration_number
WHERE registration_no IS NULL
  AND registration_number IS NOT NULL;

ALTER TABLE public.ngos
  ALTER COLUMN registration_number DROP NOT NULL,
  ALTER COLUMN contact_phone DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL;
