import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditClientForm from './EditClientForm'
import Link from 'next/link'
import { Users, Mail, Phone, Stethoscope } from 'lucide-react'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('doctors').select('*').eq('id', id).maybeSingle()
  if (!client) notFound()

  const { data: license } = await supabase
    .from('licenses').select('*').eq('doctor_id', id).maybeSingle()

  const safeLicense = license ?? {
    doctor_id: id, plan: 'free', status: 'active',
    expires_at: null, enabled_modules: ['patients', 'appointments', 'followups'], notes: '',
  }

  let clinic = null
  let clinicDoctors: any[] = []

  if (client.account_type === 'clinic_admin') {
    const { data: clinicData } = await supabase
      .from('clinics').select('*').eq('admin_id', id).maybeSingle()
    clinic = clinicData

    if (clinic) {
      // Obtener médicos de la clínica (sin join por schema cache)
      const { data: cdRows } = await supabase
        .from('clinic_doctors')
        .select('*')
        .eq('clinic_id', clinic.id)
        .neq('doctor_id', id) // excluir al admin

      if (cdRows && cdRows.length > 0) {
        const doctorIds = cdRows.map((cd: any) => cd.doctor_id)
        const { data: profiles } = await supabase
          .from('doctors').select('id, full_name, specialty, phone, email').in('id', doctorIds)

        clinicDoctors = cdRows.map((cd: any) => ({
          ...cd,
          doctor: profiles?.find((d: any) => d.id === cd.doctor_id) ?? null,
        }))
      }
    }
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <EditClientForm client={client} license={safeLicense} clinic={clinic} />

      {/* Médicos de la clínica */}
      {client.account_type === 'clinic_admin' && (
        <div className="mt-5 rounded-2xl overflow-hidden"
          style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div className="px-5 py-4 flex items-center justify-between border-b"
            style={{ borderColor: '#334155' }}>
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: '#818cf8' }} />
              <div>
                <h2 className="font-bold text-sm text-white">
                  Médicos de {clinic?.name ?? 'la clínica'}
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#475569' }}>
                  {clinicDoctors.length} de {clinic?.max_doctors ?? '?'} cupos usados
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
              {clinicDoctors.length} médicos
            </span>
          </div>

          {clinicDoctors.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">👨‍⚕️</p>
              <p className="text-sm" style={{ color: '#475569' }}>No hay médicos en esta clínica aún</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#334155' }}>
              {clinicDoctors.map((cd: any) => {
                const doc = cd.doctor
                const initials = doc?.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase() ?? '?'
                return (
                  <div key={cd.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{doc?.full_name ?? '—'}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {doc?.specialty && (
                          <span className="text-[10px] flex items-center gap-1" style={{ color: '#64748b' }}>
                            <Stethoscope size={10} /> {doc.specialty.replace('_', ' ')}
                          </span>
                        )}
                        {doc?.email && (
                          <span className="text-[10px] flex items-center gap-1" style={{ color: '#64748b' }}>
                            <Mail size={10} /> {doc.email}
                          </span>
                        )}
                        {doc?.phone && (
                          <span className="text-[10px] flex items-center gap-1" style={{ color: '#64748b' }}>
                            <Phone size={10} /> {doc.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
                      Médico
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}