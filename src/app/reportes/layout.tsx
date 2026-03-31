import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function ReportesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: doctor } = await supabase
    .from('doctors').select('*').eq('id', user.id).single()

  const { data: license } = await supabase
    .from('licenses').select('enabled_modules, status').eq('doctor_id', user.id).single()

  const enabledModules: string[] = license?.enabled_modules ?? []

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-main)' }}>
      <Sidebar doctor={doctor} enabledModules={enabledModules} />
      <main className="flex-1 min-h-screen md:ml-[240px]">
        {children}
      </main>
    </div>
  )
}