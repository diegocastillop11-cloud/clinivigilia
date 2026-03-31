import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, UserPlus, ClipboardList, Activity, ArrowRight, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClinicDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('admin_id', user.id)
    .single()

  if (!clinic) redirect('/dashboard')

  // Médicos de la clínica
  const { data: clinicDoctors } = await supabase
    .from('clinic_doctors')
    .select('*, doctors(*)')
    .eq('clinic_id', clinic.id)

  const doctors = clinicDoctors ?? []
  const activeDoctors = doctors.filter((d: any) => d.doctors?.account_type !== 'suspended')

  // Pacientes de la clínica
  const { count: patientCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinic.id)

  // Citas de hoy
  const today = new Date().toISOString().split('T')[0]
  const { count: todayAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_at', `${today}T00:00:00`)
    .lte('scheduled_at', `${today}T23:59:59`)

  const stats = [
    { label: 'Médicos activos', value: activeDoctors.length, max: clinic.max_doctors, icon: Users, color: '#10b981' },
    { label: 'Total pacientes', value: patientCount ?? 0, icon: ClipboardList, color: '#818cf8' },
    { label: 'Citas hoy', value: todayAppointments ?? 0, icon: Activity, color: '#f59e0b' },
    { label: 'Cupos disponibles', value: clinic.max_doctors - activeDoctors.length, icon: UserPlus, color: '#60a5fa' },
  ]

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Building2 size={20} style={{ color: '#10b981' }} />
            <h1 className="font-display text-2xl font-bold text-white">{clinic.name}</h1>
          </div>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Panel de administración · Plan {clinic.plan?.toUpperCase()}
          </p>
        </div>
        <Link href="/clinica/admin/medicos/nuevo">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
            <UserPlus size={16} /> Agregar Médico
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: s.color + '20' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <p className="font-display text-3xl font-bold text-white">{s.value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#64748b' }}>{s.label}</p>
            {'max' in s && (
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#334155' }}>
                <div className="h-full rounded-full transition-all" style={{
                  background: s.color,
                  width: `${Math.min((s.value / (s as any).max) * 100, 100)}%`
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Médicos */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #334155' }}>
          <div>
            <h2 className="font-display font-bold text-white">Médicos de la clínica</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {activeDoctors.length} de {clinic.max_doctors} cupos usados
            </p>
          </div>
          <Link href="/clinica/admin/medicos"
            className="inline-flex items-center gap-1 text-xs font-medium"
            style={{ color: '#10b981' }}>
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        {doctors.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-3xl mb-3">👨‍⚕️</p>
            <p className="text-sm font-semibold text-white mb-1">No hay médicos aún</p>
            <p className="text-xs mb-4" style={{ color: '#475569' }}>Agrega el primer médico a tu clínica</p>
            <Link href="/clinica/admin/medicos/nuevo">
              <button className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                Agregar médico
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#334155' }}>
            {doctors.slice(0, 8).map((cd: any) => {
              const doc = cd.doctors
              const initials = doc?.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase() ?? '?'
              return (
                <div key={cd.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-800 transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: cd.role === 'admin' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{doc?.full_name}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {doc?.specialty?.replace('_',' ') || 'Sin especialidad'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={cd.role === 'admin'
                      ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' }
                      : { background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
                    {cd.role === 'admin' ? 'Admin' : 'Médico'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}