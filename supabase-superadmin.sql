-- ============================================================
--  ClinivigilIA — Sistema Super Admin + Licencias
--  Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── 1. Marcar super admin en doctors ────────────────────
alter table public.doctors
  add column if not exists is_superadmin boolean default false,
  add column if not exists plan          text default 'free'
    check (plan in ('free','pro','premium','enterprise')),
  add column if not exists plan_expires_at timestamptz,
  add column if not exists status        text default 'active'
    check (status in ('active','suspended','trial')),
  add column if not exists created_by    uuid references public.doctors(id);

-- ─── 2. Tabla de módulos disponibles ─────────────────────
create table if not exists public.modules (
  id          text primary key,   -- 'patients','appointments','followups','ai','reports','email'
  label       text not null,
  description text,
  icon        text,
  available_on text[] default array['free','pro','premium','enterprise']
);

insert into public.modules (id, label, description, icon, available_on) values
  ('patients',     'Pacientes',          'Gestión de fichas y registros de pacientes', '👥', array['free','pro','premium','enterprise']),
  ('appointments', 'Citas',              'Agendamiento y control de citas médicas',    '📅', array['free','pro','premium','enterprise']),
  ('followups',    'Seguimiento',        'Historial clínico y notas de evolución',     '📋', array['free','pro','premium','enterprise']),
  ('reports',      'Reportes',           'Exportación de reportes y estadísticas',     '📊', array['pro','premium','enterprise']),
  ('email',        'Correos Automáticos','Seguimiento automático por email',           '✉️', array['pro','premium','enterprise']),
  ('ai',           'Inteligencia IA',    'Análisis predictivo y alertas con IA',      '🤖', array['premium','enterprise'])
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  available_on = excluded.available_on;

-- ─── 3. Tabla de licencias (módulos por doctor) ──────────
create table if not exists public.licenses (
  id          uuid primary key default uuid_generate_v4(),
  doctor_id   uuid not null unique references public.doctors(id) on delete cascade,
  plan        text not null default 'free'
    check (plan in ('free','pro','premium','enterprise')),
  status      text not null default 'active'
    check (status in ('active','suspended','trial')),
  expires_at  timestamptz,
  -- módulos habilitados individualmente (override del plan)
  enabled_modules text[] default array['patients','appointments','followups'],
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.licenses enable row level security;

-- Solo el superadmin puede gestionar licencias
create policy "Superadmin manages all licenses"
  on public.licenses for all
  using (
    exists (
      select 1 from public.doctors
      where id = auth.uid() and is_superadmin = true
    )
  );

-- Cada doctor puede leer su propia licencia
create policy "Doctors read own license"
  on public.licenses for select
  using (auth.uid() = doctor_id);

create trigger licenses_updated_at
  before update on public.licenses
  for each row execute procedure public.handle_updated_at();

-- ─── 4. Superadmin puede leer todos los doctors ───────────
create policy "Superadmin reads all doctors"
  on public.doctors for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.doctors
      where id = auth.uid() and is_superadmin = true
    )
  );

create policy "Superadmin updates all doctors"
  on public.doctors for update
  using (
    auth.uid() = id
    or exists (
      select 1 from public.doctors
      where id = auth.uid() and is_superadmin = true
    )
  );

-- ─── 5. Vista: panel de clientes para el superadmin ──────
create or replace view public.admin_clients_view as
select
  d.id,
  d.full_name,
  d.specialty,
  d.phone,
  d.clinic_name,
  d.is_superadmin,
  d.created_at,
  l.plan,
  l.status,
  l.expires_at,
  l.enabled_modules,
  l.notes,
  coalesce(ps.total, 0) as patient_count
from public.doctors d
left join public.licenses l on l.doctor_id = d.id
left join public.patient_stats ps on ps.doctor_id = d.id
where d.is_superadmin = false or d.is_superadmin is null;

-- ─── 6. Marcar tu cuenta como superadmin ─────────────────
-- Esto lo hace el trigger handle_new_user al crear la cuenta,
-- pero si ya existe el usuario, lo actualizamos aquí:
-- (Reemplaza el email con el tuyo si ya creaste la cuenta)
update public.doctors
set is_superadmin = true
where id = (
  select id from auth.users
  where email = 'diego.castillo.p11@gmail.com'
  limit 1
);

-- Si no existía aún, se marcará automáticamente al registrarse
-- con ese email gracias a la función de abajo:

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  superadmin_email text := 'diego.castillo.p11@gmail.com';
begin
  insert into public.doctors (id, full_name, is_superadmin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    (new.email = superadmin_email)
  )
  on conflict (id) do update
    set is_superadmin = (new.email = superadmin_email);
  return new;
end; $$;

-- ─── 7. Función para crear doctor desde el admin ──────────
create or replace function public.admin_create_doctor(
  p_email       text,
  p_full_name   text,
  p_specialty   text default null,
  p_plan        text default 'free',
  p_status      text default 'active',
  p_expires_at  timestamptz default null,
  p_modules     text[] default array['patients','appointments','followups'],
  p_notes       text default null,
  p_password    text default null
)
returns json language plpgsql security definer as $$
declare
  new_user_id uuid;
  result json;
begin
  -- Verificar que quien llama es superadmin
  if not exists (
    select 1 from public.doctors where id = auth.uid() and is_superadmin = true
  ) then
    raise exception 'No autorizado';
  end if;

  -- Crear usuario en auth con contraseña si se provee
  select id into new_user_id
  from auth.users where email = p_email limit 1;

  if new_user_id is null then
    -- El usuario se crea desde el cliente con supabase.auth.admin
    -- Esta función solo registra los datos si el usuario ya fue creado
    raise exception 'Usuario no encontrado. Créalo primero desde el panel.';
  end if;

  -- Actualizar perfil del doctor
  update public.doctors set
    full_name  = p_full_name,
    specialty  = p_specialty,
    created_by = auth.uid()
  where id = new_user_id;

  -- Crear/actualizar licencia
  insert into public.licenses (doctor_id, plan, status, expires_at, enabled_modules, notes)
  values (new_user_id, p_plan, p_status, p_expires_at, p_modules, p_notes)
  on conflict (doctor_id) do update set
    plan = excluded.plan,
    status = excluded.status,
    expires_at = excluded.expires_at,
    enabled_modules = excluded.enabled_modules,
    notes = excluded.notes;

  select json_build_object('success', true, 'doctor_id', new_user_id) into result;
  return result;
end; $$;

-- ─── 8. Módulos: política pública de lectura ─────────────
alter table public.modules enable row level security;
create policy "Anyone reads modules"
  on public.modules for select using (true);

-- ============================================================
--  ✅ Listo. Pasos siguientes:
--  1. Crear tu cuenta en /auth/register con diego.castillo.p11@gmail.com
--  2. El SQL ya te marcará como superadmin automáticamente
--  3. Ir a /admin para ver el panel
-- ============================================================
