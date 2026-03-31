'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Mail, Bell, Calendar, Pill, FileText, AlertCircle, X, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const FOLLOWUP_TYPES = [
  { value: 'nota',        label: 'Nota',         icon: FileText,     color: '#64748b' },
  { value: 'evolucion',   label: 'Evolución',    icon: FileText,     color: '#0ea5e9' },
  { value: 'laboratorio', label: 'Laboratorio',  icon: AlertCircle,  color: '#8b5cf6' },
  { value: 'imagen',      label: 'Imagen',       icon: AlertCircle,  color: '#06b6d4' },
  { value: 'receta',      label: 'Receta',       icon: Pill,         color: '#10b981' },
  { value: 'alerta',      label: 'Alerta',       icon: AlertCircle,  color: '#ef4444' },
]

const REMINDER_TYPES = [
  { value: 'visita',        label: 'Próxima visita',       icon: Calendar },
  { value: 'medicamento',   label: 'Medicamentos',         icon: Pill },
  { value: 'post_consulta', label: 'Post-consulta',        icon: FileText },
  { value: 'examen',        label: 'Examen pendiente',     icon: AlertCircle },
]

interface Props {
  patientId: string
  patientEmail?: string | null
  onSaved?: () => void
}

const inputStyle = {
  background: 'var(--bg-main)', border: '1px solid var(--border-color)',
  color: 'var(--text-primary)', borderRadius: '10px', padding: '9px 12px',
  fontSize: '13px', outline: 'none', width: '100%',
}

export default function AddFollowupForm({ patientId, patientEmail, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [form, setForm] = useState({
    type: 'nota',
    title: '',
    content: '',
    is_alert: false,
    alert_level: 'info' as 'info'|'warning'|'critical',
    next_visit_date: '',
    reminder_enabled: false,
    reminder_type: 'visita',
    reminder_days: 7,
    reminder_message: '',
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: followup, error } = await supabase.from('followups').insert({
      patient_id: patientId,
      doctor_id: user.id,
      type: form.type,
      title: form.title,
      content: form.content,
      is_alert: form.is_alert,
      alert_level: form.is_alert ? form.alert_level : null,
      next_visit_date: form.next_visit_date || null,
      reminder_enabled: form.reminder_enabled,
      reminder_type: form.reminder_enabled ? form.reminder_type : null,
      reminder_days: form.reminder_days,
      reminder_message: form.reminder_message || null,
    }).select().single()

    if (error) { toast.error('Error al guardar'); setSaving(false); return }

    // Si tiene recordatorio, crear en tabla reminders
    if (form.reminder_enabled && patientEmail && followup) {
      const nextSend = new Date()
      nextSend.setDate(nextSend.getDate() + form.reminder_days)
      await supabase.from('reminders').insert({
        followup_id: followup.id,
        patient_id: patientId,
        doctor_id: user.id,
        type: form.reminder_type,
        subject: `Recordatorio: ${form.title}`,
        message: form.reminder_message || form.content,
        patient_email: patientEmail,
        send_every_days: form.reminder_days,
        next_send_at: nextSend.toISOString(),
        active: true,
      })
    }

    toast.success('Seguimiento guardado')
    setForm({ type: 'nota', title: '', content: '', is_alert: false, alert_level: 'info', next_visit_date: '', reminder_enabled: false, reminder_type: 'visita', reminder_days: 7, reminder_message: '' })
    setShowReminder(false)
    setSaving(false)
    onSaved?.()
  }

  const handleSendEmailNow = async () => {
    if (!patientEmail) { toast.error('El paciente no tiene email registrado'); return }
    if (!form.reminder_message && !form.content) { toast.error('Escribe un mensaje para enviar'); return }
    setSendingEmail(true)
    try {
      const res = await fetch('/api/seguimiento/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type: form.reminder_type || 'visita',
          message: form.reminder_message || form.content,
          nextVisitDate: form.next_visit_date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al enviar'); return }
      toast.success(`✅ Email enviado a ${patientEmail}`)
    } catch { toast.error('Error de conexión') }
    finally { setSendingEmail(false) }
  }

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FileText size={15} style={{ color: 'var(--clinic-primary)' }} /> Nuevo Seguimiento
      </h3>

      {/* Tipo */}
      <div className="grid grid-cols-3 gap-2">
        {FOLLOWUP_TYPES.map(t => (
          <button key={t.value} type="button" onClick={() => set('type', t.value)}
            className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              border: `1.5px solid ${form.type === t.value ? t.color : 'var(--border-color)'}`,
              background: form.type === t.value ? `${t.color}15` : 'transparent',
              color: form.type === t.value ? t.color : 'var(--text-muted)',
            }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Título */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>Título *</label>
        <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Control mensual, Resultado de laboratorio..." />
      </div>

      {/* Contenido */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>Descripción</label>
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' } as any}
          value={form.content} onChange={e => set('content', e.target.value)}
          placeholder="Notas clínicas, indicaciones, observaciones..." />
      </div>

      {/* Próxima visita */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>
          📅 Fecha próxima visita
        </label>
        <input type="date" style={inputStyle} value={form.next_visit_date}
          onChange={e => set('next_visit_date', e.target.value)} />
        {form.next_visit_date && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--clinic-primary)' }}>
            ⚡ Se generará alerta automática 7 días antes
          </p>
        )}
      </div>

      {/* Alerta */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_alert} onChange={e => set('is_alert', e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Marcar como alerta clínica</span>
        </label>
        {form.is_alert && (
          <select style={{ ...inputStyle, width: 'auto', padding: '6px 10px' }}
            value={form.alert_level} onChange={e => set('alert_level', e.target.value)}>
            <option value="info">ℹ️ Info</option>
            <option value="warning">⚠️ Advertencia</option>
            <option value="critical">🚨 Crítica</option>
          </select>
        )}
      </div>

      {/* Recordatorios */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        <button type="button" onClick={() => setShowReminder(!showReminder)}
          className="w-full flex items-center justify-between px-4 py-3 text-left transition-all hover:opacity-80"
          style={{ background: showReminder ? 'var(--clinic-primary-light)' : 'var(--bg-main)' }}>
          <div className="flex items-center gap-2">
            <Bell size={14} style={{ color: 'var(--clinic-primary)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Configurar recordatorios automáticos
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{showReminder ? '▲' : '▼'}</span>
        </button>

        {showReminder && (
          <div className="p-4 space-y-4" style={{ background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)' }}>

            {!patientEmail && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#d97706' }}>
                <AlertCircle size={13} /> Este paciente no tiene email — no se podrán enviar recordatorios
              </div>
            )}

            {/* Tipo de recordatorio */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>Tipo de recordatorio</label>
              <div className="grid grid-cols-2 gap-2">
                {REMINDER_TYPES.map(rt => (
                  <button key={rt.value} type="button" onClick={() => set('reminder_type', rt.value)}
                    className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      border: `1.5px solid ${form.reminder_type === rt.value ? 'var(--clinic-primary)' : 'var(--border-color)'}`,
                      background: form.reminder_type === rt.value ? 'var(--clinic-primary-light)' : 'transparent',
                      color: form.reminder_type === rt.value ? 'var(--clinic-primary)' : 'var(--text-muted)',
                    }}>
                    <rt.icon size={13} /> {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frecuencia */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Enviar cada cuántos días
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <button type="button" onClick={() => set('reminder_days', Math.max(1, form.reminder_days - 1))}
                    className="w-6 h-6 rounded-lg flex items-center justify-center font-bold hover:opacity-70"
                    style={{ color: 'var(--clinic-primary)' }}>−</button>
                  <input type="number" min="1" max="365" value={form.reminder_days}
                    onChange={e => set('reminder_days', parseInt(e.target.value) || 1)}
                    className="w-12 text-center bg-transparent outline-none text-sm font-black"
                    style={{ color: 'var(--text-primary)' }} />
                  <button type="button" onClick={() => set('reminder_days', form.reminder_days + 1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center font-bold hover:opacity-70"
                    style={{ color: 'var(--clinic-primary)' }}>+</button>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>días entre recordatorios</span>
              </div>
            </div>

            {/* Mensaje del recordatorio */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Mensaje para el paciente
              </label>
              <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' } as any}
                value={form.reminder_message}
                onChange={e => set('reminder_message', e.target.value)}
                placeholder="Ej: Estimado paciente, le recordamos que debe tomar su medicamento diariamente..." />
            </div>

            {/* Activar recordatorio automático */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.reminder_enabled}
                onChange={e => set('reminder_enabled', e.target.checked)}
                disabled={!patientEmail}
                className="w-4 h-4 rounded" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Activar recordatorio automático cada {form.reminder_days} días
              </span>
            </label>

            {/* Enviar ahora */}
            {patientEmail && (
              <button type="button" onClick={handleSendEmailNow} disabled={sendingEmail}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--clinic-primary-light)', color: 'var(--clinic-primary)', border: '1px solid var(--clinic-primary-medium)' }}>
                {sendingEmail ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {sendingEmail ? 'Enviando...' : `Enviar email ahora a ${patientEmail}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Guardar */}
      <button type="button" onClick={handleSave} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, var(--clinic-primary), color-mix(in srgb, var(--clinic-primary) 70%, #000))` }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? 'Guardando...' : 'Guardar seguimiento'}
      </button>
    </div>
  )
}