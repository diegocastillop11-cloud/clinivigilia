-- ============================================================
--  ClinivigilIA — Personalización de clínica
--  Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── TABLA: clinic_settings ──────────────────────────────
create table if not exists public.clinic_settings (
  id              uuid primary key default uuid_generate_v4(),
  doctor_id       uuid not null unique references public.doctors(id) on delete cascade,
  clinic_name     text,
  logo_url        text,
  avatar_url      text,
  primary_color   text default '#0ea5e9',
  theme           text default 'light' check (theme in ('light', 'dark')),
  sidebar_color   text default 'white' check (sidebar_color in ('white', 'dark', 'colored')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.clinic_settings enable row level security;

create policy "Doctors manage own settings"
  on public.clinic_settings for all
  using (auth.uid() = doctor_id)
  with check (auth.uid() = doctor_id);

create trigger clinic_settings_updated_at
  before update on public.clinic_settings
  for each row execute procedure public.handle_updated_at();

-- ─── STORAGE BUCKETS ─────────────────────────────────────
-- Bucket para logos de clínica
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-assets',
  'clinic-assets',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Bucket para fotos de perfil
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  3145728,  -- 3MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Políticas de Storage: cada doctor solo sube/edita sus propios archivos
create policy "Doctors upload own clinic assets"
  on storage.objects for insert
  with check (bucket_id = 'clinic-assets' and auth.role() = 'authenticated');

create policy "Doctors update own clinic assets"
  on storage.objects for update
  using (bucket_id = 'clinic-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Doctors delete own clinic assets"
  on storage.objects for delete
  using (bucket_id = 'clinic-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read clinic assets"
  on storage.objects for select
  using (bucket_id = 'clinic-assets');

create policy "Doctors upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Doctors update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Doctors delete own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================
--  ✅ Listo. Ahora el código React puede guardar preferencias
--     y subir imágenes a Supabase Storage.
-- ============================================================
