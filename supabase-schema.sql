-- ============================================================
--  ClinivigilIA — Esquema completo de base de datos
--  Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Habilitar extensiones ───────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── TABLA: doctors (perfil extendido del auth.users) ───
create table public.doctors (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  specialty   text,
  license_no  text,
  phone       text,
  clinic_name text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.doctors enable row level security;

create policy "Doctors can view own profile"
  on public.doctors for select
  using (auth.uid() = id);

create policy "Doctors can update own profile"
  on public.doctors for update
  using (auth.uid() = id);

create policy "Doctors can insert own profile"
  on public.doctors for insert
  with check (auth.uid() = id);

-- ─── TABLA: patients ─────────────────────────────────────
create table public.patients (
  id            uuid primary key default uuid_generate_v4(),
  doctor_id     uuid not null references public.doctors(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  rut           text,
  email         text,
  phone         text,
  birth_date    date,
  gender        text check (gender in ('masculino','femenino','otro')),
  address       text,
  specialty     text not null,   -- cardiologia, neurologia, etc.
  status        text not null default 'activo'
                check (status in ('activo','pendiente','alta','suspendido')),
  notes         text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.patients enable row level security;

create policy "Doctors see own patients"
  on public.patients for select
  using (auth.uid() = doctor_id);

create policy "Doctors insert own patients"
  on public.patients for insert
  with check (auth.uid() = doctor_id);

create policy "Doctors update own patients"
  on public.patients for update
  using (auth.uid() = doctor_id);

create policy "Doctors delete own patients"
  on public.patients for delete
  using (auth.uid() = doctor_id);

-- trigger: updated_at automático
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger patients_updated_at
  before update on public.patients
  for each row execute procedure public.handle_updated_at();

-- ─── TABLA: appointments (citas) ─────────────────────────
create table public.appointments (
  id            uuid primary key default uuid_generate_v4(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  doctor_id     uuid not null references public.doctors(id) on delete cascade,
  scheduled_at  timestamptz not null,
  duration_min  int default 30,
  type          text not null default 'control'
                check (type in ('primera_vez','control','urgencia','teleconsulta','procedimiento')),
  status        text not null default 'programada'
                check (status in ('programada','confirmada','completada','cancelada','no_asistio')),
  location      text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.appointments enable row level security;

create policy "Doctors see own appointments"
  on public.appointments for select
  using (auth.uid() = doctor_id);

create policy "Doctors insert own appointments"
  on public.appointments for insert
  with check (auth.uid() = doctor_id);

create policy "Doctors update own appointments"
  on public.appointments for update
  using (auth.uid() = doctor_id);

create policy "Doctors delete own appointments"
  on public.appointments for delete
  using (auth.uid() = doctor_id);

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute procedure public.handle_updated_at();

-- índice para consultas por fecha
create index appointments_scheduled_at_idx on public.appointments(scheduled_at);
create index appointments_doctor_id_idx on public.appointments(doctor_id);

-- ─── TABLA: followups (seguimientos) ─────────────────────
create table public.followups (
  id            uuid primary key default uuid_generate_v4(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  doctor_id     uuid not null references public.doctors(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  type          text not null default 'nota'
                check (type in ('nota','evolucion','laboratorio','imagen','receta','alerta','email_enviado')),
  title         text not null,
  content       text not null,
  is_alert      boolean default false,
  alert_level   text check (alert_level in ('info','warning','critical')),
  created_at    timestamptz default now()
);

alter table public.followups enable row level security;

create policy "Doctors see own followups"
  on public.followups for select
  using (auth.uid() = doctor_id);

create policy "Doctors insert own followups"
  on public.followups for insert
  with check (auth.uid() = doctor_id);

create policy "Doctors update own followups"
  on public.followups for update
  using (auth.uid() = doctor_id);

create policy "Doctors delete own followups"
  on public.followups for delete
  using (auth.uid() = doctor_id);

create index followups_patient_id_idx on public.followups(patient_id);

-- ─── FUNCIÓN: auto-crear perfil doctor al registrarse ────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.doctors (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── VISTA: dashboard stats (útil para queries rápidas) ──
create or replace view public.patient_stats as
select
  doctor_id,
  count(*) as total,
  count(*) filter (where status = 'activo') as activos,
  count(*) filter (where status = 'pendiente') as pendientes,
  count(*) filter (where status = 'alta') as alta,
  count(*) filter (where status = 'suspendido') as suspendidos
from public.patients
group by doctor_id;

-- ============================================================
--  ✅ Schema listo. Próximos pasos:
--  1. Ir a Authentication → Settings → habilitar Email confirmations (opcional)
--  2. En Site URL poner tu URL de Vercel cuando hagas deploy
-- ============================================================
