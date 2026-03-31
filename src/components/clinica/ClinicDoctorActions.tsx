'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2, Pencil, PauseCircle, PlayCircle, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  doctorId: string
  clinicId: string
  isAdmin: boolean
  currentUserId: string
  doctor: any
}

const inputStyle = {
  background: '#0f172a', border: '1.5px solid #334155', color: '#f1f5f9',
  borderRadius: '12px', padding: '10px 14px', fontSize: '13px',
  outline: 'none', width: '100%', fontFamily: 'DM Sans, sans-serif',
}
const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600' as const,
  color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}

export default function ClinicDoctorActions({ doctorId, clinicId, isAdmin, currentUserId, doctor }: Props) {
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [suspended, setSuspended] = useState(doctor?.status === 'suspended')
  const [form, setForm] = useState({
    full_name: doctor?.full_name ?? '',
    specialty: doctor?.specialty ?? '',
    phone: doctor?.phone ?? '',
  })
  const router = useRouter()

  const handleRemove = async () => {
    if (isAdmin) { toast.error('No puedes eliminar al administrador'); return }
    if (doctorId === currentUserId) { toast.error('No puedes eliminarte a ti mismo'); return }
    if (!confirm('¿Eliminar este médico de la clínica?')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('clinic_doctors').delete()
      .eq('clinic_id', clinicId).eq('doctor_id', doctorId)
    if (error) toast.error('Error al eliminar')
    else { toast.success('Médico eliminado'); router.refresh() }
    setLoading(false)
  }

  const handleToggleSuspend = async () => {
    if (isAdmin) { toast.error('No puedes suspender al administrador'); return }
    const msg = suspended
      ? `¿Reactivar a ${doctor?.full_name}? Podrá volver a acceder al sistema.`
      : `¿Suspender a ${doctor?.full_name}? No podrá acceder al sistema hasta que lo reactives.`
    if (!confirm(msg)) return
    setLoading(true)
    const supabase = createClient()
    const newStatus = suspended ? 'active' : 'suspended'
    const { error } = await supabase
      .from('licenses').update({ status: newStatus }).eq('doctor_id', doctorId)
    if (error) { toast.error('Error al cambiar estado'); setLoading(false); return }
    setSuspended(!suspended)
    toast.success(suspended ? '✅ Médico reactivado' : '⏸ Médico suspendido')
    setLoading(false)
    router.refresh()
  }

  const handleSaveEdit = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('doctors').update({
      full_name: form.full_name,
      specialty: form.specialty || null,
      phone: form.phone || null,
    }).eq('id', doctorId)
    if (error) { toast.error('Error al guardar'); setLoading(false); return }
    toast.success('Médico actualizado')
    setShowEditModal(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Editar */}
        <button onClick={() => setShowEditModal(true)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          title="Editar médico">
          <Pencil size={13} style={{ color: '#818cf8' }} />
        </button>

        {/* Suspender / Reactivar */}
        {!isAdmin && (
          <button onClick={handleToggleSuspend} disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            style={{ background: suspended ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}
            title={suspended ? 'Reactivar médico' : 'Suspender médico'}>
            {loading
              ? <Loader2 size={13} className="animate-spin" style={{ color: '#64748b' }} />
              : suspended
                ? <PlayCircle size={13} style={{ color: '#10b981' }} />
                : <PauseCircle size={13} style={{ color: '#f59e0b' }} />}
          </button>
        )}

        {/* Eliminar */}
        {!isAdmin && (
          <button onClick={handleRemove} disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20 disabled:opacity-50"
            title="Eliminar de la clínica">
            {loading
              ? <Loader2 size={13} className="animate-spin" style={{ color: '#64748b' }} />
              : <Trash2 size={13} style={{ color: '#ef4444' }} />}
          </button>
        )}
      </div>

      {/* Modal editar */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: '#0f172a', border: '1px solid #334155', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: '#1e293b' }}>
              <div>
                <h3 className="font-bold text-white">Editar Médico</h3>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{doctor?.full_name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                <X size={14} style={{ color: '#64748b' }} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label style={labelStyle}>Nombre completo</label>
                <input style={inputStyle} value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Especialidad</label>
                <input style={inputStyle} value={form.specialty}
                  placeholder="Ej: Cardiología"
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input style={inputStyle} value={form.phone}
                  placeholder="+56 9..."
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}