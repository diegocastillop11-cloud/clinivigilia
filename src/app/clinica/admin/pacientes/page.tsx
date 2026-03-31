import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SPECIALTY_LABELS: Record<string, string> = {
  cardiologia: 'Cardiología', neurologia: 'Neurología', oncologia: 'Oncología',
  pediatria: 'Pediatría', ortopedia: 'Ortopedia', endocrinologia: 'Endocrinología',
  ginecologia: 'Ginecología', dermatologia: 'Dermatología', psiquiatria: 'Psiquiatría',
  medicina_general: 'Medicina General',
}

const AVATAR_COLORS = ['#0ea5e9','#0369a1','#06b6d4','#7c3aed','#059669','#f59e0b','#ec4899','#8b5cf6']

function calcAge(dob: string | null): string {
  if (!dob) return '—'
  return Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970) + ' años'
}

interface PageProps {
  searchParams: { q?: string; status?: string; doctor?: string }
}

export default async function ClinicPacientesPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clinic } = await supabase
    .from('clinics').select('*').eq('admin_id', user.id).single()
  if (!clinic) redirect('/dashboard')

  // Obtener IDs de médicos de la clínica
  const { data: clinicDoctors } = await supabase
    .from('clinic_doctors').select('doctor_id').eq('clinic_id', clinic.id)
  const doctorIds = (clinicDoctors ?? []).map((cd: any) => cd.doctor_id)

  if (doctorIds.length === 0) {
    return (
      <div style={{ color: '#f1f5f9' }}>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Pacientes</h1>
        <p style={{ color: '#64748b' }}>No hay médicos en esta clínica aún.</p>
      </div>
    )
  }

  // Obtener perfiles de médicos para el filtro
  const { data: doctorProfiles } = await supabase
    .from('doctors').select('id, full_name').in('id', doctorIds)

  // Query de pacientes
  let query = supabase
    .from('patients').select('*')
    .in('doctor_id', doctorIds)
    .order('created_at', { ascending: false })

  if (searchParams.status && searchParams.status !== 'todos')
    query = query.eq('status', searchParams.status)
  if (searchParams.doctor && searchParams.doctor !== 'todos')
    query = query.eq('doctor_id', searchParams.doctor)
  if (searchParams.q)
    query = query.or(`first_name.ilike.%${searchParams.q}%,last_name.ilike.%${searchParams.q}%,rut.ilike.%${searchParams.q}%`)

  const { data: patients } = await query

  // Mapa doctor_id → nombre
  const doctorMap = Object.fromEntries((doctorProfiles ?? []).map((d: any) => [d.id, d.full_name]))

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Pacientes</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            {patients?.length ?? 0} pacientes en {clinic.name}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <form className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2.5 rounded-xl"
            style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <Search size={14} style={{ color: '#475569' }} />
            <input name="q" defaultValue={searchParams.q}
              placeholder="Buscar por nombre, RUT..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#f1f5f9' }} />
          </div>
          <select name="status" defaultValue={searchParams.status ?? 'todos'}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }}>
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="pendiente">Pendiente</option>
            <option value="alta">Alta</option>
          </select>
          <select name="doctor" defaultValue={searchParams.doctor ?? 'todos'}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }}>
            <option value="todos">Todos los médicos</option>
            {(doctorProfiles ?? []).map((d: any) => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
          <button type="submit"
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            Buscar
          </button>
          <Link href="/clinica/admin/pacientes">
            <button type="button" className="px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: '#0f172a', border: '1px solid #334155', color: '#64748b' }}>
              Limpiar
            </button>
          </Link>
        </form>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        {/* Header */}
        <div className="px-5 py-3 border-b" style={{ background: '#0f172a', borderColor: '#334155' }}>
          <div className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] gap-4">
            {['Paciente','Especialidad','Médico','Estado','Edad','Teléfono'].map(h => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>{h}</p>
            ))}
          </div>
        </div>

        {!patients || patients.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto mb-3" style={{ color: '#334155' }} />
            <p className="text-sm font-semibold text-white mb-1">No se encontraron pacientes</p>
            <p className="text-xs" style={{ color: '#475569' }}>
              {searchParams.q ? 'Intenta con otra búsqueda' : 'Los pacientes de tus médicos aparecerán aquí'}
            </p>
          </div>
        ) : patients.map((p: any, i: number) => {
          const initials = (p.first_name[0] + p.last_name[0]).toUpperCase()
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
          const statusStyles: Record<string, { bg: string; text: string }> = {
            activo:    { bg: 'rgba(16,185,129,0.1)',  text: '#10b981' },
            pendiente: { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b' },
            alta:      { bg: 'rgba(129,140,248,0.1)', text: '#818cf8' },
          }
          const statusStyle = statusStyles[p.status] ?? { bg: 'rgba(100,116,139,0.1)', text: '#64748b' }

          return (
            <div key={p.id}
              className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] gap-4 items-center px-5 py-3.5 border-b hover:bg-slate-800 transition-colors"
              style={{ borderColor: '#334155' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: color }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{p.first_name} {p.last_name}</p>
                  <p className="text-[10px]" style={{ color: '#475569' }}>
                    {new Date(p.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              <span className="text-xs" style={{ color: '#94a3b8' }}>
                {SPECIALTY_LABELS[p.specialty] ?? p.specialty ?? '—'}
              </span>
              <span className="text-xs" style={{ color: '#64748b' }}>
                {doctorMap[p.doctor_id] ?? '—'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: statusStyle.bg, color: statusStyle.text }}>
                {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
              </span>
              <span className="text-xs" style={{ color: '#64748b' }}>{calcAge(p.birth_date)}</span>
              <span className="text-xs" style={{ color: '#64748b' }}>{p.phone ?? '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}