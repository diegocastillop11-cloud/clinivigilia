import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import ClinicDoctorActions from '@/components/clinica/ClinicDoctorActions'

export const dynamic = 'force-dynamic'

export default async function ClinicMedicosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clinic } = await supabase
    .from('clinics').select('*').eq('admin_id', user.id).single()
  if (!clinic) redirect('/dashboard')

  // Query separada — sin join para evitar el error de schema cache
  const { data: clinicDoctors } = await supabase
    .from('clinic_doctors')
    .select('*')
    .eq('clinic_id', clinic.id)
    .order('joined_at', { ascending: false })

  // Obtener los perfiles de los doctores por separado
  const doctorIds = (clinicDoctors ?? []).map((cd: any) => cd.doctor_id)
  const { data: doctorProfiles } = doctorIds.length > 0
    ? await supabase.from('doctors').select('*').in('id', doctorIds)
    : { data: [] }

  // Combinar manualmente
  const doctors = (clinicDoctors ?? []).map((cd: any) => ({
    ...cd,
    doctors: (doctorProfiles ?? []).find((d: any) => d.id === cd.doctor_id) ?? null,
  }))

  const maxDoctors = clinic.max_doctors ?? 999
  const canAddMore = doctors.length < maxDoctors

  return (
    <div style={{ color: '#f1f5f9' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Médicos</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {doctors.length} de {maxDoctors} cupos · Plan {clinic.plan?.toUpperCase()}
          </p>
        </div>
        {canAddMore ? (
          <Link href="/clinica/admin/medicos/nuevo">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
              <UserPlus size={16} /> Agregar Médico
            </button>
          </Link>
        ) : (
          <div className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            Límite de médicos alcanzado
          </div>
        )}
      </div>

      {/* Barra de uso */}
      <div className="p-4 rounded-2xl mb-6" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: '#64748b' }}>Cupos utilizados</span>
          <span className="text-xs font-bold text-white">{doctors.length}/{maxDoctors}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#334155' }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min((doctors.length / maxDoctors) * 100, 100)}%`,
              background: doctors.length >= maxDoctors ? '#ef4444' : 'linear-gradient(90deg, #10b981, #059669)'
            }} />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-5 py-3 border-b" style={{ background: '#0f172a', borderColor: '#334155' }}>
          <div className="grid grid-cols-[1fr,1fr,auto,auto,auto] gap-4">
            {['Médico','Especialidad','Rol','Estado','Acciones'].map(h => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>{h}</p>
            ))}
          </div>
        </div>

        {doctors.length === 0 ? (
          <div className="py-16 text-center">
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
        ) : doctors.map((cd: any) => {
          const doc = cd.doctors
          const initials = doc?.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase() ?? '?'
          return (
            <div key={cd.id}
              className="grid grid-cols-[1fr,1fr,auto,auto,auto] gap-4 items-center px-5 py-3.5 border-b hover:bg-slate-800 transition-colors"
              style={{ borderColor: '#334155' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: cd.role === 'admin' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{doc?.full_name ?? '—'}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{doc?.email ?? doc?.phone ?? '—'}</p>
                </div>
              </div>
              <p className="text-sm capitalize" style={{ color: '#94a3b8' }}>
                {doc?.specialty?.replace('_',' ') ?? '—'}
              </p>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={cd.role === 'admin'
                  ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' }
                  : { background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
                {cd.role === 'admin' ? 'Admin' : 'Médico'}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={doc?.status === 'suspended'
                  ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                  : { background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                {doc?.status === 'suspended' ? 'Suspendido' : 'Activo'}
              </span>
              <ClinicDoctorActions
                doctorId={doc?.id}
                clinicId={clinic.id}
                isAdmin={cd.role === 'admin'}
                currentUserId={user.id}
                doctor={doc}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}