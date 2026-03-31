'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Edit, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminClientActions({ clientId, currentStatus }: { clientId: string; currentStatus: string }) {
  const router = useRouter()

  const toggleSuspend = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const supabase = createClient()
    const { error } = await supabase.from('licenses').update({ status: newStatus }).eq('doctor_id', clientId)
    if (error) { toast.error('Error'); return }
    toast.success(newStatus === 'suspended' ? 'Cliente suspendido' : 'Cliente reactivado')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/admin/clientes/${clientId}`}>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8' }}
          title="Editar">
          <Edit size={13} />
        </button>
      </Link>
      <button onClick={toggleSuspend}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: currentStatus === 'suspended' ? 'rgba(110,231,183,0.1)' : 'rgba(248,113,113,0.1)',
                 color: currentStatus === 'suspended' ? '#6ee7b7' : '#f87171' }}
        title={currentStatus === 'suspended' ? 'Reactivar' : 'Suspender'}>
        <RotateCcw size={13} />
      </button>
    </div>
  )
}
