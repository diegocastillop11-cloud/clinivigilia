import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { ClipboardList, AlertTriangle, Bell, Calendar, Send } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import SendReminderBanner from '@/components/followups/SendReminderBanner'

export const dynamic = 'force-dynamic'

const TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  nota:          { icon: '📝', label: 'Nota' },
  evolucion:     { icon: '📈', label: 'Evolución' },
  laboratorio:   { icon: '🧪', label: 'Laboratorio' },
  imagen:        { icon: '🩻', label: 'Imagen' },
  receta:        { icon: '💊', label: 'Receta' },
  alerta:        { icon: '⚠️', label: 'Alerta' },
  email_enviado: { icon: '✉️', label: 'Email' },
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function SeguimientoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: doctor } = await supabase.from('doctors').select('*').eq('id', user.id).single()

  const { data: license } = await supabase
    .from('licenses').select('enabled_modules, status').eq('doctor_id', user.id).single()
  const enabledModules: string[] = license?.enabled_modules ?? []

  const { data: followups } = await supabase
    .from('followups')
    .select('*, patient:patients(id,first_name,last_name,specialty,email)')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const all = followups ?? []
  const alerts = all.filter(f => f.is_alert)

  // Visitas próximas ≤7 días
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const today = new Date().toISOString().split('T')[0]

  const visitAlerts = all.filter(f => {
    if (!f.next_visit_date) return false
    const days = getDaysUntil(f.next_visit_date)
    return days >= 0 && days <= 7
  }).sort((a, b) =>
    new Date(a.next_visit_date).getTime() - new Date(b.next_visit_date).getTime()
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar doctor={doctor} enabledModules={enabledModules} />
      <main className="ml-[240px] flex-1 p-8 min-h-screen animate-in">

        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">Seguimiento</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {all.length} registros · {alerts.length} alertas clínicas
              {visitAlerts.length > 0 && (
                <span className="ml-2 text-amber-500 font-semibold">
                  · 🔔 {visitAlerts.length} visita{visitAlerts.length > 1 ? 's' : ''} próxima{visitAlerts.length > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Alertas de visita próxima ── */}
        {visitAlerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: '#f59e0b' }}>
              <Bell size={13} /> Visitas próximas — recordatorio recomendado
            </h2>
            <div className="space-y-2">
              {visitAlerts.map((f: any) => {
                const patient = f.patient
                return (
                  <SendReminderBanner
                    key={f.id}
                    followup={f}
                    patient={{
                      id: patient?.id,
                      first_name: patient?.first_name,
                      last_name: patient?.last_name,
                      email: patient?.email,
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ── Alertas clínicas ── */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle size={13} /> Alertas Clínicas
            </h2>
            {alerts.map((f: any) => {
              const p = f.patient
              return (
                <Link key={f.id} href={`/pacientes/${p?.id}`}>
                  <div className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all
                    ${f.alert_level === 'critical' ? 'bg-red-50 border-red-200' :
                      f.alert_level === 'warning' ? 'bg-amber-50 border-amber-200' :
                      'bg-sky-50 border-sky-200'}`}>
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-800">{f.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                          ${f.alert_level === 'critical' ? 'bg-red-100 text-red-600' :
                            f.alert_level === 'warning' ? 'bg-amber-100 text-amber-700' :
                            'bg-sky-100 text-sky-600'}`}>
                          {f.alert_level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{f.content}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Paciente: <span className="font-medium text-slate-600">{p?.first_name} {p?.last_name}</span>
                        {' · '}{format(parseISO(f.created_at), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Todos los registros ── */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="font-display font-bold text-slate-700">Todos los Registros</h2>
              <p className="text-xs text-slate-400 mt-0.5">Historial completo de seguimientos</p>
            </div>
          </div>

          {all.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">No hay registros de seguimiento</p>
              <p className="text-xs text-slate-400 mt-1">
                Los seguimientos aparecen aquí cuando ingresas notas en la ficha de cada paciente
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {all.map((f: any) => {
                const p = f.patient
                const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.nota
                const hasVisitAlert = f.next_visit_date && getDaysUntil(f.next_visit_date) <= 7 && getDaysUntil(f.next_visit_date) >= 0
                const daysLeft = f.next_visit_date ? getDaysUntil(f.next_visit_date) : null

                return (
                  <Link key={f.id} href={`/pacientes/${p?.id}`}>
                    <div className="flex items-start gap-4 px-5 py-4 hover:bg-sky-50 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg flex-shrink-0">
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {cfg.label}
                          </span>
                          {f.is_alert && (
                            <span className="text-[9px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                              ALERTA
                            </span>
                          )}
                          {hasVisitAlert && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              daysLeft! <= 2 ? 'bg-red-100 text-red-600' :
                              daysLeft! <= 4 ? 'bg-amber-100 text-amber-600' :
                              'bg-blue-100 text-blue-600'}`}>
                              🔔 VISITA {daysLeft === 0 ? 'HOY' : daysLeft === 1 ? 'MAÑANA' : `EN ${daysLeft}D`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{f.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{f.content}</p>
                        {f.next_visit_date && (
                          <p className="text-[11px] mt-0.5 font-medium" style={{
                            color: hasVisitAlert ? (daysLeft! <= 2 ? '#dc2626' : daysLeft! <= 4 ? '#d97706' : '#0284c7') : '#94a3b8'
                          }}>
                            📅 Próxima visita: {new Date(f.next_visit_date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          <span className="font-medium text-sky-500">{p?.first_name} {p?.last_name}</span>
                          {' · '}{format(parseISO(f.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}