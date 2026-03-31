import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bell, Calendar, Send } from 'lucide-react'

export default async function VisitAlerts({ doctorId }: { doctorId: string }) {
  const supabase = createClient()

  // Pacientes con visita próxima en los próximos 7 días
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const { data: alerts } = await supabase
    .from('followups')
    .select('*, patients(id, first_name, last_name, email)')
    .eq('doctor_id', doctorId)
    .not('next_visit_date', 'is', null)
    .gte('next_visit_date', new Date().toISOString().split('T')[0])
    .lte('next_visit_date', sevenDaysFromNow.toISOString().split('T')[0])
    .order('next_visit_date', { ascending: true })

  if (!alerts || alerts.length === 0) return null

  return (
    <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.1)' }}>
        <Bell size={15} style={{ color: '#f59e0b' }} />
        <p className="text-sm font-bold" style={{ color: '#d97706' }}>
          {alerts.length} paciente{alerts.length > 1 ? 's' : ''} con visita próxima
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
        {alerts.map((alert: any) => {
          const patient = alert.patients
          const visitDate = new Date(alert.next_visit_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const daysLeft = Math.ceil((visitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <div key={alert.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: daysLeft <= 2 ? '#ef4444' : daysLeft <= 4 ? '#f59e0b' : '#10b981' }}>
                {patient?.first_name?.[0]}{patient?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {patient?.first_name} {patient?.last_name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {alert.title} · {visitDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{
                    background: daysLeft <= 2 ? 'rgba(239,68,68,0.15)' : daysLeft <= 4 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                    color: daysLeft <= 2 ? '#ef4444' : daysLeft <= 4 ? '#f59e0b' : '#10b981',
                  }}>
                  {daysLeft === 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `${daysLeft} días`}
                </span>
                {patient?.email && (
                  <Link href={`/pacientes/${patient.id}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'var(--clinic-primary-light)', color: 'var(--clinic-primary)' }}>
                    <Send size={11} /> Recordar
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}