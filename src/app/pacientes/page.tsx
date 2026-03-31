import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, UserPlus, Search } from 'lucide-react'
import PatientTable from '@/components/patients/PatientTable'

export const dynamic = 'force-dynamic'

const SPECIALTY_LABELS: Record<string, string> = {
  cardiologia: 'Cardiología', neurologia: 'Neurología', oncologia: 'Oncología',
  pediatria: 'Pediatría', ortopedia: 'Ortopedia', endocrinologia: 'Endocrinología',
  ginecologia: 'Ginecología', dermatologia: 'Dermatología', psiquiatria: 'Psiquiatría',
  medicina_general: 'Medicina General',
}

interface PageProps {
  searchParams: { q?: string; status?: string; specialty?: string }
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let query = supabase
    .from('patients').select('*')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })

  if (searchParams.status && searchParams.status !== 'todos')
    query = query.eq('status', searchParams.status)
  if (searchParams.specialty && searchParams.specialty !== 'todas')
    query = query.eq('specialty', searchParams.specialty)
  if (searchParams.q)
    query = query.or(`first_name.ilike.%${searchParams.q}%,last_name.ilike.%${searchParams.q}%,rut.ilike.%${searchParams.q}%`)

  const { data: patients = [] } = await query

  // Buscar seguimientos con visita próxima ≤7 días
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const today = new Date().toISOString().split('T')[0]

  const { data: upcomingFollowups } = await supabase
    .from('followups')
    .select('patient_id, next_visit_date, title')
    .eq('doctor_id', user.id)
    .not('next_visit_date', 'is', null)
    .gte('next_visit_date', today)
    .lte('next_visit_date', sevenDaysFromNow.toISOString().split('T')[0])

  // Mapear alertas por patient_id
  const alertsByPatient: Record<string, { days: number; date: string; title: string }> = {}
  for (const f of upcomingFollowups ?? []) {
    if (!f.next_visit_date) continue
    const days = getDaysUntil(f.next_visit_date)
    const existing = alertsByPatient[f.patient_id]
    if (!existing || days < existing.days) {
      alertsByPatient[f.patient_id] = { days, date: f.next_visit_date, title: f.title }
    }
  }

  // Enriquecer pacientes con sus alertas
  const patientsWithAlerts = (patients ?? []).map((p: any) => ({
    ...p,
    visitAlert: alertsByPatient[p.id] ?? null,
  }))

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {patients?.length ?? 0} pacientes registrados
            {Object.keys(alertsByPatient).length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-semibold">
                · 🔔 {Object.keys(alertsByPatient).length} con visita próxima
              </span>
            )}
          </p>
        </div>
        <Link href="/pacientes/nuevo" className="btn-primary">
          <UserPlus size={16} /> Nuevo Paciente
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <form className="flex items-center gap-3 p-4">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input name="q" defaultValue={searchParams.q}
              placeholder="Buscar por nombre, RUT..."
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400" />
          </div>
          <select name="status" defaultValue={searchParams.status ?? 'todos'} className="form-input w-auto min-w-[140px]">
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="pendiente">Pendiente</option>
            <option value="alta">Alta</option>
            <option value="suspendido">Suspendido</option>
          </select>
          <select name="specialty" defaultValue={searchParams.specialty ?? 'todas'} className="form-input w-auto min-w-[160px]">
            <option value="todas">Todas las especialidades</option>
            {Object.entries(SPECIALTY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Buscar</button>
          <Link href="/pacientes" className="btn-outline">Limpiar</Link>
        </form>
      </div>

      {/* Table */}
      {patientsWithAlerts.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="font-display font-bold text-slate-600 mb-1">No se encontraron pacientes</h3>
          <p className="text-sm text-slate-400 mb-6">
            {searchParams.q ? 'Intenta con otra búsqueda' : 'Comienza registrando tu primer paciente'}
          </p>
          <Link href="/pacientes/nuevo" className="btn-primary inline-flex">
            <UserPlus size={16} /> Registrar paciente
          </Link>
        </div>
      ) : (
        <PatientTable patients={patientsWithAlerts} />
      )}
    </div>
  )
}