import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClinicAdminSidebar from '@/components/clinica/ClinicAdminSidebar'

export default async function ClinicAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verificar que es admin de clínica
  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('admin_id', user.id)
    .single()

  if (!clinic) redirect('/dashboard')

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen" style={{ background: '#0f172a' }}>
      <ClinicAdminSidebar clinic={clinic} doctor={doctor} />
      <main className="ml-[260px] flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}