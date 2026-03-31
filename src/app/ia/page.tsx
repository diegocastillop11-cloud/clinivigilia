import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IAChat from '@/components/ia/IAChat'

export const dynamic = 'force-dynamic'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

export default async function IAPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: doctor } = await supabase
    .from('doctors').select('*').eq('id', user.id).single()

  const isSuperAdmin = user.email === SUPERADMIN_EMAIL

  if (!isSuperAdmin) {
    const { data: license } = await supabase
      .from('licenses').select('enabled_modules, status').eq('doctor_id', user.id).single()

    const hasAccess =
      license?.status === 'active' &&
      Array.isArray(license?.enabled_modules) &&
      (license.enabled_modules.includes('ai') || license.enabled_modules.includes('ia'))

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 h-screen px-6"
          style={{ background: 'var(--bg-main)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, #818cf820, #6366f120)', border: '1px solid #6366f130' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Módulo no disponible
          </h2>
          <p className="text-sm text-center max-w-sm" style={{ color: 'var(--text-muted)' }}>
            No tienes acceso al módulo de IA. Contacta a tu administrador para habilitar esta funcionalidad en tu plan.
          </p>
        </div>
      )
    }
  }

  const { data: patients } = await supabase
    .from('patients').select('*')
    .eq('doctor_id', user.id).eq('status', 'activo').order('first_name')

  return <IAChat doctor={doctor} patients={patients ?? []} />
}