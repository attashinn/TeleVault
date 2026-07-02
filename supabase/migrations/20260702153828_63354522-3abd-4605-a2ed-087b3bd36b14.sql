
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default-user',
  filename TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  telegram_message_id BIGINT NOT NULL,
  telegram_file_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO anon, authenticated;
GRANT ALL ON public.files TO service_role;

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read files" ON public.files FOR SELECT USING (true);
CREATE POLICY "Public insert files" ON public.files FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete files" ON public.files FOR DELETE USING (true);

CREATE INDEX idx_files_upload_date ON public.files (upload_date DESC);
