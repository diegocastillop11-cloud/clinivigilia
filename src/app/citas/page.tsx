import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import AppointmentActions from '@/components/appointments/AppointmentActions'

const TYPE_LABELS: Record<string, string> = {
  primera_vez: 'Primera vez', control: 'Control',
  urgencia: 'Urgencia', teleconsulta: 'Teleconsulta', procedimiento: 'Procedimiento',
}
const STATUS_LABELS: Record<string, string> = {
  programada: 'Programada', confirmada: 'Confirmada',
  completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió',
}
const SPECIALTY_LABELS: Record<string, string> = {
  cardiologia: 'Cardiología', neurologia: 'Neurología', oncologia: 'Oncología',
  pediatria: 'Pediatría', ortopedia: 'Ortopedia', endocrinologia: 'Endocrinología',
  ginecologia: 'Ginecología', dermatologia: 'Dermatología', psiquiatria: 'Psiquiatría',
  medicina_general: 'Medicina General',
}

function formatDate(str: string) {
  const d = parseISO(str)
  if (isToday(d)) return `Hoy · ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `Mañana · ${format(d, 'HH:mm')}`
  return format(d, "EEEE d MMM, HH:mm", { locale: es })
}

interface PageProps { searchParams: { status?: string; patient?: string } }

export const dynamic = 'force-dynamic'

export default async function CitasPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let query = supabase
    .from('appointments')
    .select('*, patient:patients(id,first_name,last_name,specialty)')
    .eq('doctor_id', user.id)
    .order('scheduled_at', { ascending: false })

  if (searchParams.status && searchParams.status !== 'todas') {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.patient) {
    query = query.eq('patient_id', searchParams.patient)
  }

  const { data: appointments = [] } = await query

  const upcoming = appointments?.filter(a =>
    !isPast(parseISO(a.scheduled_at)) && ['programada','confirmada'].includes(a.status)
  ) ?? []
  const past = appointments?.filter(a =>
    isPast(parseISO(a.scheduled_at)) || ['completada','cancelada','no_asistio'].includes(a.status)
  ) ?? []

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Citas</h1>
          <p className="text-sm text-slate-400 mt-0.5">{upcoming.length} citas próximas</p>
        </div>
        <Link href="/citas/nueva" className="btn-primary">
          <Plus size={16} /> Nueva Cita
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <form className="flex items-center gap-3 p-4">
          <select name="status" defaultValue={searchParams.status ?? 'todas'}
            className="form-input w-auto min-w-[160px]">
            <option value="todas">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="submit" className="btn-primary">Filtrar</button>
          <Link href="/citas" className="btn-outline">Limpiar</Link>
        </form>
      </div>

      <div className="space-y-6">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-slate-600 text-sm uppercase tracking-widest mb-3">
              📅 Próximas ({upcoming.length})
            </h2>
            <div className="card overflow-hidden">
              {upcoming.map((appt, i) => {
                const p = appt.patient as any
                return (
                  <div key={appt.id}
                    className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-sky-50 transition-colors">
                    {/* Date block */}
                    <div className="w-14 h-14 bg-sky-50 border border-sky-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="font-display text-xl font-bold text-sky-600 leading-none">
                        {format(parseISO(appt.scheduled_at), 'd')}
                      </span>
                      <span className="text-[9px] font-bold text-sky-400 uppercase">
                        {format(parseISO(appt.scheduled_at), 'MMM', { locale: es })}
                      </span>
                    </div>
                    {/* Patient */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/pacientes/${p?.id}`}>
                        <p className="text-sm font-bold text-slate-800 hover:text-sky-600 transition-colors">
                          {p?.first_name} {p?.last_name}
                        </p>
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {TYPE_LABELS[appt.type]} · {SPECIALTY_LABELS[p?.specialty] ?? ''} · {appt.duration_min} min
                      </p>
                    </div>
                    {/* Time */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-sky-600 capitalize">{formatDate(appt.scheduled_at)}</p>
                      {appt.location && <p className="text-xs text-slate-400">{appt.location}</p>}
                    </div>
                    {/* Status + actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`status-dot ${appt.status} text-xs`}>{STATUS_LABELS[appt.status]}</span>
                      <AppointmentActions apptId={appt.id} currentStatus={appt.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-slate-400 text-sm uppercase tracking-widest mb-3">
              🗓 Historial ({past.length})
            </h2>
            <div className="card overflow-hidden">
              {past.map(appt => {
                const p = appt.patient as any
                return (
                  <div key={appt.id}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="font-display text-base font-bold text-slate-500">
                        {format(parseISO(appt.scheduled_at), 'd')}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {format(parseISO(appt.scheduled_at), 'MMM', { locale: es })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{p?.first_name} {p?.last_name}</p>
                      <p className="text-xs text-slate-400">{TYPE_LABELS[appt.type]} · {format(parseISO(appt.scheduled_at), 'HH:mm')}</p>
                    </div>
                    <span className={`badge text-xs
                      ${appt.status === 'completada' ? 'badge-alta' :
                        appt.status === 'cancelada' ? 'badge-suspendido' : 'badge-pendiente'}`}>
                      {STATUS_LABELS[appt.status]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(!appointments || appointments.length === 0) && (
          <div className="card px-6 py-16 text-center">
            <Calendar size={40} className="text-slate-300 mx-auto mb-4" />
            <h3 className="font-display font-bold text-slate-600 mb-1">No hay citas</h3>
            <Link href="/citas/nueva" className="btn-primary mt-4 inline-flex">
              <Plus size={16} /> Agendar primera cita
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
