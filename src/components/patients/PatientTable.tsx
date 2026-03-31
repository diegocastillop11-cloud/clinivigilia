'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, Trash2, Calendar, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const SPECIALTY_LABELS: Record<string, string> = {
  cardiologia: 'Cardiología', neurologia: 'Neurología', oncologia: 'Oncología',
  pediatria: 'Pediatría', ortopedia: 'Ortopedia', endocrinologia: 'Endocrinología',
  ginecologia: 'Ginecología', dermatologia: 'Dermatología', psiquiatria: 'Psiquiatría',
  medicina_general: 'Medicina General',
}

const AVATAR_COLORS = [
  '#0ea5e9','#0369a1','#06b6d4','#0891b2','#7c3aed',
  '#059669','#dc2626','#c2410c','#d97706','#9333ea'
]

function calcAge(dob: string | null): string {
  if (!dob) return '—'
  return Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970) + ' años'
}

interface PatientWithAlert {
  id: string
  first_name: string
  last_name: string
  rut?: string
  specialty: string
  status: string
  birth_date?: string | null
  phone?: string | null
  created_at: string
  visitAlert?: { days: number; date: string; title: string } | null
  [key: string]: any
}

export default function PatientTable({ patients }: { patients: PatientWithAlert[] }) {
  const router = useRouter()

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al paciente ${name}? Esta acción no se puede deshacer.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success(`${name} eliminado`)
    router.refresh()
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Paciente', 'RUT', 'Especialidad', 'Estado', 'Edad', 'Teléfono', 'Acciones'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((p, i) => {
              const initials = (p.first_name[0] + p.last_name[0]).toUpperCase()
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
              const alert = p.visitAlert
              const alertColor = alert
                ? alert.days <= 2 ? { bg: '#fef2f2', text: '#dc2626', badge: '#fee2e2' }
                : alert.days <= 4 ? { bg: '#fffbeb', text: '#d97706', badge: '#fef3c7' }
                : { bg: '#f0f9ff', text: '#0284c7', badge: '#e0f2fe' }
                : null

              return (
                <tr key={p.id}
                  className="border-b border-slate-50 transition-colors group"
                  style={{ background: alert && alertColor ? alertColor.bg : undefined }}>

                  {/* Paciente */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: color }}>
                          {initials}
                        </div>
                        {/* Campanita de alerta sobre el avatar */}
                        {alert && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: alertColor!.text }}>
                            <Bell size={8} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/pacientes/${p.id}`}
                            className="text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors">
                            {p.first_name} {p.last_name}
                          </Link>
                          {/* Badge de visita próxima */}
                          {alert && alertColor && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                              style={{ background: alertColor.badge, color: alertColor.text }}>
                              {alert.days === 0 ? '¡HOY!' : alert.days === 1 ? 'MAÑANA' : `${alert.days}D`}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {new Date(p.created_at).toLocaleDateString('es-CL')}
                        </p>
                        {/* Info de la visita próxima */}
                        {alert && alertColor && (
                          <p className="text-[10px] font-medium mt-0.5" style={{ color: alertColor.text }}>
                            🔔 Visita: {new Date(alert.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} · {alert.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-sm text-slate-500">{p.rut || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge spec-${p.specialty}`}>
                      {SPECIALTY_LABELS[p.specialty] ?? p.specialty}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge badge-${p.status}`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{calcAge(p.birth_date ?? null)}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{p.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/pacientes/${p.id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-sky-100 hover:text-sky-600 transition-colors">
                        <Eye size={15} />
                      </Link>
                      <Link href={`/citas/nueva?patient=${p.id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                        <Calendar size={15} />
                      </Link>
                      <button onClick={() => handleDelete(p.id, `${p.first_name} ${p.last_name}`)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
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