import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Calendar, ClipboardList, TrendingUp, ArrowRight, AlertCircle, Plus } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const SPECIALTY_LABELS: Record<string, string> = {
  cardiologia: 'Cardiología', neurologia: 'Neurología', oncologia: 'Oncología',
  pediatria: 'Pediatría', ortopedia: 'Ortopedia', endocrinologia: 'Endocrinología',
  ginecologia: 'Ginecología', dermatologia: 'Dermatología', psiquiatria: 'Psiquiatría',
  medicina_general: 'Medicina General',
}

const APPT_TYPE_LABELS: Record<string, string> = {
  primera_vez: 'Primera vez', control: 'Control', urgencia: 'Urgencia',
  teleconsulta: 'Teleconsulta', procedimiento: 'Procedimiento',
}

function formatApptDate(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return `Hoy ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `Mañana ${format(d, 'HH:mm')}`
  return format(d, "d MMM, HH:mm", { locale: es })
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  activo:     { bg: 'rgba(16,185,129,0.1)',  text: '#059669' },
  pendiente:  { bg: 'rgba(245,158,11,0.1)',  text: '#d97706' },
  alta:       { bg: 'rgba(99,102,241,0.1)',  text: '#6366f1' },
  suspendido: { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626' },
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [statsRes, recentPatientsRes, upcomingRes, alertsRes, doctorRes] = await Promise.all([
    supabase.from('patient_stats').select('*').eq('doctor_id', user.id).single(),
    supabase.from('patients').select('id,first_name,last_name,specialty,status,created_at')
      .eq('doctor_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('appointments')
      .select('*, patient:patients(first_name,last_name,specialty)')
      .eq('doctor_id', user.id)
      .gte('scheduled_at', new Date().toISOString())
      .in('status', ['programada', 'confirmada'])
      .order('scheduled_at', { ascending: true }).limit(6),
    supabase.from('followups').select('*')
      .eq('doctor_id', user.id).eq('is_alert', true)
      .order('created_at', { ascending: false }).limit(3),
    supabase.from('doctors').select('full_name').eq('id', user.id).single(),
  ])

  const stats = statsRes.data ?? { total: 0, activos: 0, pendientes: 0, alta: 0 }
  const recentPatients = recentPatientsRes.data ?? []
  const upcoming = upcomingRes.data ?? []
  const alerts = alertsRes.data ?? []
  const doctorName = doctorRes.data?.full_name?.split(' ')[0] ?? 'Doctor'

  // Visitas próximas ≤7 días
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: visitAlertsRaw } = await supabase
    .from('followups')
    .select('id, next_visit_date, title, patients(id, first_name, last_name)')
    .eq('doctor_id', user.id)
    .not('next_visit_date', 'is', null)
    .gte('next_visit_date', todayStr)
    .lte('next_visit_date', sevenDaysFromNow.toISOString().split('T')[0])
    .order('next_visit_date', { ascending: true })
  const visitAlerts = visitAlertsRaw ?? []

  const today = format(new Date(), "EEEE d 'De' MMMM, yyyy", { locale: es })
    .split(' ').map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {doctorName} 👋
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>{today}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/pacientes/nuevo">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))', boxShadow: '0 4px 12px color-mix(in srgb, var(--clinic-primary) 30%, transparent)' }}>
              <Plus size={15} /> Nuevo Paciente
            </button>
          </Link>
          <Link href="/citas/nueva">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <Calendar size={15} /> Agendar Cita
            </button>
          </Link>
        </div>
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div className="mb-5 space-y-2">
          {alerts.map(alert => (
            <div key={alert.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                background: alert.alert_level === 'critical' ? 'rgba(239,68,68,0.08)' : alert.alert_level === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(14,165,233,0.08)',
                border: `1px solid ${alert.alert_level === 'critical' ? 'rgba(239,68,68,0.2)' : alert.alert_level === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(14,165,233,0.2)'}`,
                color: alert.alert_level === 'critical' ? '#dc2626' : alert.alert_level === 'warning' ? '#d97706' : '#0284c7',
              }}>
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">{alert.title}: </span>
                {alert.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Pacientes', value: stats.total,     icon: Users,        color: 'var(--clinic-primary)', sub: 'Registrados' },
          { label: 'En Tratamiento', value: stats.activos,    icon: TrendingUp,   color: '#10b981',               sub: 'Activos' },
          { label: 'Pendientes',     value: stats.pendientes, icon: ClipboardList, color: '#f59e0b',              sub: 'En revisión' },
          { label: 'Con Alta',       value: stats.alta,       icon: Calendar,     color: '#8b5cf6',               sub: 'Recuperados' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="rounded-2xl p-4 md:p-5 relative overflow-hidden transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: color }} />
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="font-display text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xs mt-1.5 font-semibold" style={{ color }}>↑ {sub}</p>
          </div>
        ))}
      </div>

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_220px] gap-4">

        {/* Próximas citas */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h2 className="font-display font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>Próximas Citas</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{upcoming.length} citas programadas</p>
            </div>
            <Link href="/citas"
              className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
              style={{ color: 'var(--clinic-primary)' }}>
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar size={28} className="mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay citas próximas</p>
              <Link href="/citas/nueva">
                <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'var(--clinic-primary)' }}>
                  <Calendar size={14} /> Agendar cita
                </button>
              </Link>
            </div>
          ) : upcoming.map((appt, i) => {
            const p = appt.patient as any
            const initials = p ? (p.first_name[0] + p.last_name[0]).toUpperCase() : '?'
            const colors = ['#0ea5e9','#06b6d4','#0284c7','#7c3aed','#059669','#f59e0b']
            return (
              <Link key={appt.id} href={`/citas/${appt.id}`}>
                <div className="flex items-center gap-3 px-5 py-3.5 transition-colors last:border-0 cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: colors[i % colors.length] }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {p?.first_name} {p?.last_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {APPT_TYPE_LABELS[appt.type]} · {SPECIALTY_LABELS[p?.specialty] ?? ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--clinic-primary)' }}>
                      {formatApptDate(appt.scheduled_at)}
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                      style={appt.status === 'confirmada'
                        ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                        : { background: 'var(--clinic-primary-light)', color: 'var(--clinic-primary)' }}>
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Últimos pacientes */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h2 className="font-display font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>Últimos Pacientes</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Recién ingresados</p>
            </div>
            <Link href="/pacientes"
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--clinic-primary)' }}>
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {recentPatients.length === 0 ? (
            <div className="py-10 text-center">
              <Users size={28} className="mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin pacientes aún</p>
            </div>
          ) : recentPatients.map((p, i) => {
            const initials = (p.first_name[0] + p.last_name[0]).toUpperCase()
            const colors = ['#0ea5e9','#0369a1','#06b6d4','#7c3aed','#059669']
            const statusStyle = STATUS_STYLES[p.status] ?? STATUS_STYLES.activo
            return (
              <Link key={p.id} href={`/pacientes/${p.id}`}>
                <div className="flex items-center gap-3 px-4 py-3 transition-colors last:border-0"
                  style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: colors[i % colors.length] }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                      {SPECIALTY_LABELS[p.specialty] ?? p.specialty}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: statusStyle.bg, color: statusStyle.text }}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
        {/* ── Alertas de visita próxima ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: 'var(--border-color)', background: 'rgba(245,158,11,0.05)' }}>
            <span className="text-sm">🔔</span>
            <div>
              <h2 className="font-display font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Alertas</h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{visitAlerts.length} visitas próximas</p>
            </div>
          </div>
          {visitAlerts.length === 0 ? (
            <div className="py-8 text-center px-3">
              <p className="text-xl mb-1">✅</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin alertas pendientes</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {visitAlerts.slice(0, 6).map((alert: any) => {
                const p = alert.patients
                const daysLeft = Math.ceil((new Date(alert.next_visit_date).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
                const color = daysLeft <= 2 ? '#ef4444' : daysLeft <= 4 ? '#f59e0b' : '#0ea5e9'
                const initials = p ? `${p.first_name?.[0]}${p.last_name?.[0]}` : '?'
                return (
                  <a key={alert.id} href={`/pacientes/${p?.id}`}>
                    <div className="flex items-center gap-2 px-3 py-2.5 hover:opacity-80 transition-opacity cursor-pointer">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ background: color }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {p?.first_name} {p?.last_name}
                        </p>
                        <p className="text-[10px] truncate" style={{ color }}>
                          {daysLeft === 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `${daysLeft} días`}
                        </p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: color }} />
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}