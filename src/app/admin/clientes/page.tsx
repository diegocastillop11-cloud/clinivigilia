import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import AdminClientsTable from '@/components/admin/AdminClientsTable'

export const dynamic = 'force-dynamic'

interface PageProps { searchParams: { q?: string; plan?: string; status?: string } }

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let query = supabase.from('admin_clients_view').select('*').order('created_at', { ascending: false })
  if (searchParams.plan   && searchParams.plan   !== 'todos') query = query.eq('plan',   searchParams.plan)
  if (searchParams.status && searchParams.status !== 'todos') query = query.eq('status', searchParams.status)
  if (searchParams.q) query = query.ilike('full_name', `%${searchParams.q}%`)

  const { data: clients = [] } = await query

  return (
    <div style={{ color: '#f1f5f9' }}>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Clientes</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            {clients?.length ?? 0} doctores registrados
          </p>
        </div>
        <Link href="/admin/clientes/nuevo">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
            <Plus size={16} /> Nuevo Cliente
          </button>
        </Link>
      </div>

      {/* Filters */}
      <form className="flex items-center gap-3 p-4 rounded-2xl mb-5"
        style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5"
          style={{ background: '#0f172a', border: '1px solid #334155' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input name="q" defaultValue={searchParams.q}
            placeholder="Buscar por nombre..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#f1f5f9' }} />
        </div>
        <select name="plan" defaultValue={searchParams.plan ?? 'todos'}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }}>
          <option value="todos">Todos los planes</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select name="status" defaultValue={searchParams.status ?? 'todos'}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }}>
          <option value="todos">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspendido</option>
        </select>
        <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#6366f1' }}>Filtrar</button>
        <Link href="/admin/clientes"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
          Limpiar
        </Link>
      </form>

      <AdminClientsTable clients={clients ?? []} />
    </div>
  )
}
