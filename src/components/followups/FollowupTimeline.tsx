'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Followup } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, AlertTriangle, Send, Calendar, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  nota:          { icon: '📝', label: 'Nota clínica',   color: 'bg-slate-100' },
  evolucion:     { icon: '📈', label: 'Evolución',       color: 'bg-sky-50' },
  laboratorio:   { icon: '🧪', label: 'Laboratorio',     color: 'bg-purple-50' },
  imagen:        { icon: '🩻', label: 'Imagen',          color: 'bg-indigo-50' },
  receta:        { icon: '💊', label: 'Receta',          color: 'bg-emerald-50' },
  alerta:        { icon: '⚠️', label: 'Alerta',          color: 'bg-amber-50' },
  email_enviado: { icon: '✉️', label: 'Email enviado',   color: 'bg-blue-50' },
}

const ALERT_COLORS: Record<string, string> = {
  info:     'border-sky-200 bg-sky-50',
  warning:  'border-amber-200 bg-amber-50',
  critical: 'border-red-200 bg-red-50',
}

interface FollowupExtended extends Followup {
  next_visit_date?: string | null
  patient_email?: string | null
  patient_id: string
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function SendReminderButton({ followup, patientEmail, patientId }: {
  followup: FollowupExtended
  patientEmail?: string | null
  patientId?: string
}) {
  const [sending, setSending] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  if (!followup.next_visit_date || dismissed) return null

  const daysLeft = getDaysUntil(followup.next_visit_date)
  if (daysLeft > 7 || daysLeft < 0) return null

  const urgency = daysLeft <= 2 ? 'critical' : daysLeft <= 4 ? 'warning' : 'info'
  const colors = {
    critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#dc2626', btn: '#ef4444' },
    warning:  { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#d97706', btn: '#f59e0b' },
    info:     { bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.25)', text: '#0284c7', btn: '#0ea5e9' },
  }[urgency]

  const daysText = daysLeft === 0 ? '¡hoy!' : daysLeft === 1 ? 'mañana' : `en ${daysLeft} días`
  const visitFormatted = new Date(followup.next_visit_date).toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  const handleSend = async () => {
    if (!patientEmail) { toast.error('El paciente no tiene email registrado'); return }
    setSending(true)
    try {
      const res = await fetch('/api/seguimiento/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId ?? followup.patient_id,
          followupId: followup.id,
          type: 'visita',
          message: `Le recordamos que tiene una visita médica programada ${daysText} (${visitFormatted}). Por favor confirme su asistencia o contáctenos para reagendar si es necesario.`,
          nextVisitDate: followup.next_visit_date,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al enviar'); return }
      toast.success(`✅ Recordatorio enviado a ${patientEmail}`)
      setDismissed(true)
      router.refresh()
    } catch { toast.error('Error de conexión') }
    finally { setSending(false) }
  }

  return (
    <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
      <Calendar size={13} style={{ color: colors.text, flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: colors.text }}>
          Visita próxima {daysText} — {visitFormatted}
        </p>
        {patientEmail ? (
          <p className="text-[10px] mt-0.5" style={{ color: colors.text, opacity: 0.7 }}>
            Se recomienda avisar al paciente por email
          </p>
        ) : (
          <p className="text-[10px] mt-0.5" style={{ color: colors.text, opacity: 0.7 }}>
            El paciente no tiene email registrado
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {patientEmail && (
          <button onClick={handleSend} disabled={sending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: colors.btn }}>
            {sending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            {sending ? 'Enviando...' : 'Enviar recordatorio'}
          </button>
        )}
        <button onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10"
          title="Descartar alerta">
          <X size={11} style={{ color: colors.text }} />
        </button>
      </div>
    </div>
  )
}

export default function FollowupTimeline({ followups, patientEmail, patientId }: {
  followups: FollowupExtended[]
  patientEmail?: string | null
  patientId?: string
}) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro de seguimiento?')) return
    const supabase = createClient()
    const { error } = await supabase.from('followups').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Registro eliminado')
    router.refresh()
  }

  if (followups.length === 0) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-sm font-medium text-slate-500">Sin seguimientos aún</p>
        <p className="text-xs text-slate-400 mt-1">Agrega el primer registro clínico arriba</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <div>
          <h3 className="font-display font-bold text-slate-700">Todos los Registros</h3>
          <p className="text-xs text-slate-400 mt-0.5">Historial completo de seguimientos</p>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {followups.map((f, i) => {
          const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.nota
          const isFirst = i === 0
          return (
            <div key={f.id}
              className={`px-5 py-4 group hover:bg-slate-50 transition-colors
                ${f.is_alert ? `border-l-4 ${ALERT_COLORS[f.alert_level ?? 'info']}` : ''}`}>
              <div className="flex items-start gap-3">
                {/* Ícono */}
                <div className="flex flex-col items-center pt-0.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  {i < followups.length - 1 && (
                    <div className="w-px flex-1 bg-slate-100 mt-2 min-h-[16px]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {cfg.label}
                        </span>
                        {f.is_alert && f.alert_level && (
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full
                            ${f.alert_level === 'critical' ? 'bg-red-100 text-red-600' :
                              f.alert_level === 'warning' ? 'bg-amber-100 text-amber-600' :
                              'bg-sky-100 text-sky-600'}`}>
                            <AlertTriangle size={9} />
                            {f.alert_level === 'critical' ? 'Crítica' : f.alert_level === 'warning' ? 'Advertencia' : 'Alerta'}
                          </span>
                        )}
                        {isFirst && (
                          <span className="text-[9px] font-bold bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full uppercase">
                            Reciente
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mt-0.5">{f.title}</h4>
                      {f.content && (
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed whitespace-pre-line">
                          {f.content}
                        </p>
                      )}

                      {/* Alerta de visita próxima con botón opcional */}
                      <SendReminderButton
                        followup={f}
                        patientEmail={patientEmail}
                        patientId={patientId}
                      />
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => handleDelete(f.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    {format(parseISO(f.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}