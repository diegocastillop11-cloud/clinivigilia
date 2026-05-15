-- ─────────────────────────────────────────────────────────────
-- LEAD MAGNETS — Ejecutar en Supabase SQL Editor
-- Si ya ejecutaste una versión anterior, usa solo el bloque
-- de MIGRACIÓN al final de este archivo.
-- ─────────────────────────────────────────────────────────────

-- 1. Tabla principal (con preguntas dinámicas)
CREATE TABLE IF NOT EXISTS public.lead_magnets (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id   UUID        REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  slug        TEXT        NOT NULL,
  pdf_path    TEXT,
  questions   JSONB       NOT NULL DEFAULT '[]',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lead_magnets_slug_key UNIQUE (slug)
);

-- 2. Tabla de leads capturados (respuestas dinámicas en JSONB)
CREATE TABLE IF NOT EXISTS public.lead_captures (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_magnet_id   UUID        REFERENCES public.lead_magnets(id) ON DELETE CASCADE NOT NULL,
  nombre           TEXT        NOT NULL,
  email            TEXT        NOT NULL,
  telefono         TEXT        NOT NULL,
  answers          JSONB       NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Habilitar Row Level Security
ALTER TABLE public.lead_magnets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para lead_magnets
CREATE POLICY "lead_magnets_owner_all" ON public.lead_magnets
  FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "lead_magnets_public_select" ON public.lead_magnets
  FOR SELECT USING (is_active = true);

-- 5. Políticas para lead_captures
CREATE POLICY "lead_captures_public_insert" ON public.lead_captures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "lead_captures_owner_select" ON public.lead_captures
  FOR SELECT USING (
    lead_magnet_id IN (
      SELECT id FROM public.lead_magnets WHERE doctor_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- MIGRACIÓN — Ejecutar SOLO si ya creaste las tablas antes
-- ─────────────────────────────────────────────────────────────
-- ALTER TABLE public.lead_magnets  ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]';
-- ALTER TABLE public.lead_captures ADD COLUMN IF NOT EXISTS answers   JSONB NOT NULL DEFAULT '{}';
-- ALTER TABLE public.lead_captures ALTER COLUMN IF EXISTS preocupacion DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- STORAGE — Bucket para PDFs
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-pdfs', 'lead-pdfs', false, 20971520, ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "lead_pdfs_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "lead_pdfs_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'lead-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "lead_pdfs_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'lead-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "lead_pdfs_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'lead-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
