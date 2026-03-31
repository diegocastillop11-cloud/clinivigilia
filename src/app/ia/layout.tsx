import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function IALayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: license } = await supabase
    .from('licenses')
    .select('enabled_modules, status')
    .eq('doctor_id', user.id)
    .single()

  const enabledModules: string[] = license?.enabled_modules ?? []

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-main)' }} suppressHydrationWarning>
      <Sidebar doctor={doctor} enabledModules={enabledModules} />
      <main className="ml-[240px] flex-1 flex flex-col min-h-screen" suppressHydrationWarning>
        {children}
      </main>
    </div>
  )
}