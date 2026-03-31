'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Edit, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

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

export default function AdminClientsTable({ clients }: { clients: any[] }) {
  const router = useRouter()

  const toggleSuspend = async (clientId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    if (!confirm(newStatus === 'suspended' ? '¿Suspender este cliente?' : '¿Reactivar este cliente?')) return
    const supabase = createClient()
    const { error } = await supabase.from('licenses').update({ status: newStatus }).eq('doctor_id', clientId)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(newStatus === 'suspended' ? 'Cliente suspendido' : 'Cliente reactivado')
    router.refresh()
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="rounded-2xl px-6 py-16 text-center" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <p className="text-sm" style={{ color: '#475569' }}>
          No se encontraron clientes.{' '}
          <Link href="/admin/clientes/nuevo" style={{ color: '#818cf8' }}>Crear el primero →</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid #334155' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Cliente', 'Plan', 'Estado', 'Pacientes', 'Vencimiento', 'Módulos', 'Acciones'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map(c => {
              const planStyle   = PLAN_COLORS[c.plan   ?? 'free']
              const statusStyle = STATUS_COLORS[c.status ?? 'active']
              const initials    = c.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '??'
              const modules     = c.enabled_modules ?? []
              const expires     = c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-CL') : '—'

              return (
                <tr key={c.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid #0f172a' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Cliente */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{c.full_name}</p>
                        <p className="text-xs" style={{ color: '#64748b' }}>{c.clinic_name || c.specialty || '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                      style={{ background: planStyle.bg, color: planStyle.text, border: `1px solid ${planStyle.border}` }}>
                      {c.plan ?? 'free'}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: statusStyle.bg, color: statusStyle.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.text }} />
                      {c.status === 'active' ? 'Activo' : c.status === 'suspended' ? 'Suspendido' : 'Trial'}
                    </span>
                  </td>

                  {/* Pacientes */}
                  <td className="px-5 py-3.5 text-sm font-bold text-white">{c.patient_count ?? 0}</td>

                  {/* Vencimiento */}
                  <td className="px-5 py-3.5 text-xs" style={{ color: '#64748b' }}>{expires}</td>

                  {/* Módulos */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {modules.slice(0, 2).map((m: string) => (
                        <span key={m} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: '#0f172a', color: '#94a3b8' }}>{m}</span>
                      ))}
                      {modules.length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: '#0f172a', color: '#64748b' }}>+{modules.length - 2}</span>
                      )}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/clientes/${c.id}`} onClick={e => e.stopPropagation()}>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8' }}
                          title="Editar">
                          <Edit size={13} />
                        </button>
                      </Link>
                      <button
                        onClick={e => { e.stopPropagation(); toggleSuspend(c.id, c.status) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{
                          background: c.status === 'suspended' ? 'rgba(110,231,183,0.1)' : 'rgba(248,113,113,0.1)',
                          color: c.status === 'suspended' ? '#6ee7b7' : '#f87171'
                        }}
                        title={c.status === 'suspended' ? 'Reactivar' : 'Suspender'}>
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
