'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'programada', label: 'Programada' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'no_asistio', label: 'No asistió' },
]

interface Props { apptId: string; currentStatus: string }

export default function AppointmentActions({ apptId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status: string) => {
    if (status === currentStatus) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('appointments').update({ status: status as any }).eq('id', apptId)
    if (error) { toast.error('Error al actualizar'); setLoading(false); return }
    toast.success('Estado actualizado')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="relative">
      <select
        value={currentStatus}
        onChange={e => updateStatus(e.target.value)}
        disabled={loading}
        className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 pr-7 cursor-pointer hover:border-sky-400 focus:outline-none focus:border-sky-400 transition-colors"
      >
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  )
}
