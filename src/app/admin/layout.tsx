import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', user.id)
    .single()

  // Si no tiene registro en doctors (superadmin puro), igual dejarlo pasar
  // El middleware ya garantiza que solo el superadmin llega acá
  return (
    <div className="flex min-h-screen" style={{ background: '#0f172a' }}>
      <AdminSidebar doctor={doctor} />
      <main className="ml-[240px] flex-1 p-8 min-h-screen" style={{ background: '#0f172a' }}>
        {children}
      </main>
    </div>
  )
}