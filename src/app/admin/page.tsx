import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, TrendingUp, Shield, AlertTriangle, Plus, ArrowRight } from 'lucide-react'

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free:       { bg: '#1e293b', text: '#94a3b8', border: '#334155' },
  pro:        { bg: '#1e3a5f', text: '#60a5fa', border: '#1d4ed8' },
  premium:    { bg: '#1a1f3a', text: '#a5b4fc', border: '#6366f1' },
  enterprise: { bg: '#1a2e24', text: '#6ee7b7', border: '#059669' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: '#064e3b', text: '#6ee7b7' },
  suspended: { bg: '#450a0a', text: '#fca5a5' },
  trial:     { bg: '#451a03', text: '#fcd34d' },
}

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('admin_clients_view')
    .select('*')
    .order('created_at', { ascending: false })

  const all = clients ?? []
  const stats = {
    total:     all.length,
    active:    all.filter(c => c.status === 'active').length,
    trial:     all.filter(c => c.status === 'trial').length,
    suspended: all.filter(c => c.status === 'suspended').length,
    premium:   all.filter(c => c.plan === 'premium' || c.plan === 'enterprise').length,
    totalPatients: all.reduce((sum, c) => sum + (c.patient_count ?? 0), 0),
  }

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Panel de Control</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Gestión de clientes ClinivigilIA
          </p>
        </div>
        <Link href="/admin/clientes/nuevo">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
            <Plus size={16} /> Nuevo Cliente
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Clientes', value: stats.total,        icon: Users,         color: '#818cf8' },
          { label: 'Activos',        value: stats.active,       icon: TrendingUp,    color: '#6ee7b7' },
          { label: 'Premium + Ent.', value: stats.premium,      icon: Shield,        color: '#fcd34d' },
          { label: 'En Trial',       value: stats.trial,        icon: AlertTriangle, color: '#fb923c' },
          { label: 'Suspendidos',    value: stats.suspended,    icon: AlertTriangle, color: '#f87171' },
          { label: 'Total Pacientes',value: stats.totalPatients,icon: Users,         color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: s.color + '20' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <p className="font-display text-3xl font-bold text-white">{s.value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#64748b' }}>{s.label}</p>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: s.color }} />
          </div>
        ))}
      </div>

      {/* Clients table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #334155' }}>
          <div>
            <h2 className="font-display font-bold text-white">Clientes</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{all.length} registrados</p>
          </div>
          <Link href="/admin/clientes"
            className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: '#818cf8' }}>
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Cliente', 'Plan', 'Estado', 'Pacientes', 'Vencimiento', 'Módulos', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm" style={{ color: '#475569' }}>
                    No hay clientes aún.{' '}
                    <Link href="/admin/clientes/nuevo" style={{ color: '#818cf8' }}>
                      Crear el primero →
                    </Link>
                  </td>
                </tr>
              ) : all.slice(0, 10).map(c => {
                const planStyle   = PLAN_COLORS[c.plan ?? 'free']
                const statusStyle = STATUS_COLORS[c.status ?? 'active']
                const initials    = c.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '??'
                const modules     = c.enabled_modules ?? []
                const expires     = c.expires_at
                  ? new Date(c.expires_at).toLocaleDateString('es-CL')
                  : '—'
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1e293b' }}
                    className="group hover:bg-slate-800 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{c.full_name}</p>
                          <p className="text-xs" style={{ color: '#64748b' }}>
                            {c.clinic_name || c.specialty || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{ background: planStyle.bg, color: planStyle.text, border: `1px solid ${planStyle.border}` }}>
                        {c.plan ?? 'free'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: statusStyle.bg, color: statusStyle.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.text }} />
                        {c.status === 'active' ? 'Activo' : c.status === 'suspended' ? 'Suspendido' : 'Trial'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-white">
                      {c.patient_count ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#64748b' }}>{expires}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {modules.slice(0, 3).map((m: string) => (
                          <span key={m} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: '#0f172a', color: '#94a3b8' }}>
                            {m}
                          </span>
                        ))}
                        {modules.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: '#0f172a', color: '#64748b' }}>
                            +{modules.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/clientes/${c.id}`}
                        className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: '#818cf8' }}>
                        Editar →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
