ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nid_pdf BYTEA;

DO $$
DECLARE
  nid_pdf_type REGTYPE;
BEGIN
  SELECT atttypid::regtype
  INTO nid_pdf_type
  FROM pg_attribute
  WHERE attrelid = 'public.users'::regclass
    AND attname = 'nid_pdf'
    AND NOT attisdropped;

  IF nid_pdf_type <> 'bytea'::regtype THEN
    ALTER TABLE public.users
      ALTER COLUMN nid_pdf TYPE BYTEA
      USING convert_to(nid_pdf::text, 'UTF8');
  END IF;
END $$;
