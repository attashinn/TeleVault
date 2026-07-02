
DROP POLICY IF EXISTS "Public read files" ON public.files;
DROP POLICY IF EXISTS "Public insert files" ON public.files;
DROP POLICY IF EXISTS "Public delete files" ON public.files;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.files FROM anon, authenticated;
