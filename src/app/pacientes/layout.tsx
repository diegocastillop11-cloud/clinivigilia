import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function PatientsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: doctor } = await supabase.from('doctors').select('*').eq('id', user.id).single()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar doctor={doctor} />
      <main className="ml-[240px] flex-1 p-8 min-h-screen">{children}</main>
    </div>
  )
}
