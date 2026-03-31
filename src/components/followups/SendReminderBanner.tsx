'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Send, X, Loader2, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  followup: any
  patient: any
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function SendReminderBanner({ followup, patient }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (dismissed) return null

  const daysLeft = getDaysUntil(followup.next_visit_date)
  const visitDate = new Date(followup.next_visit_date)
  const visitFormatted = visitDate.toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const daysText = daysLeft === 0 ? '¡hoy!' : daysLeft === 1 ? 'mañana' : `en ${daysLeft} días`

  const urgency = daysLeft <= 2 ? 'critical' : daysLeft <= 4 ? 'warning' : 'info'
  const styles = {
    critical: {
      bg: '#fef2f2', border: '#fecaca', text: '#dc2626',
      badge: { bg: '#fee2e2', color: '#dc2626' },
      btn: { bg: '#ef4444', text: 'white' },
    },
    warning: {
      bg: '#fffbeb', border: '#fde68a', text: '#d97706',
      badge: { bg: '#fef3c7', color: '#d97706' },
      btn: { bg: '#f59e0b', text: 'white' },
    },
    info: {
      bg: '#f0f9ff', border: '#bae6fd', text: '#0284c7',
      badge: { bg: '#e0f2fe', color: '#0284c7' },
      btn: { bg: '#0ea5e9', text: 'white' },
    },
  }[urgency]

  const handleSend = async () => {
    if (!patient.email) { toast.error('El paciente no tiene email registrado'); return }
    setSending(true)
    try {
      const res = await fetch('/api/seguimiento/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          followupId: followup.id,
          type: 'visita',
          message: `Estimado/a ${patient.first_name}, le recordamos que tiene una visita médica programada ${daysText} (${visitFormatted}). Por favor confirme su asistencia o contáctenos si necesita reagendar.`,
          nextVisitDate: followup.next_visit_date,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al enviar'); return }
      toast.success(`✅ Recordatorio enviado a ${patient.email}`)
      setSent(true)
    } catch { toast.error('Error de conexión') }
    finally { setSending(false) }
  }

  return (
    <div className="rounded-2xl overflow-hidden border"
      style={{ background: styles.bg, borderColor: styles.border }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: styles.border, background: `${styles.border}50` }}>
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: styles.text }} />
          <p className="text-sm font-bold" style={{ color: styles.text }}>
            Visita próxima {daysText}
          </p>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: styles.badge.bg, color: styles.badge.color }}>
            {daysLeft === 0 ? 'HOY' : daysLeft === 1 ? 'MAÑANA' : `${daysLeft} DÍAS`}
          </span>
        </div>
        <button onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10 transition-colors">
          <X size={13} style={{ color: styles.text }} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: styles.text }}>
              📅 {visitFormatted}
            </p>
            <p className="text-xs mt-1" style={{ color: styles.text, opacity: 0.8 }}>
              Seguimiento: <strong>{followup.title}</strong>
            </p>
            {patient.email ? (
              <p className="text-xs mt-1" style={{ color: styles.text, opacity: 0.7 }}>
                {sent
                  ? `✅ Recordatorio enviado a ${patient.email}`
                  : `Se recomienda enviar recordatorio a ${patient.email}`}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: styles.text, opacity: 0.7 }}>
                ⚠️ El paciente no tiene email — no se puede enviar recordatorio
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Agendar cita */}
            <Link href={`/citas/nueva?patient=${patient.id}`}>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'white', color: styles.text, border: `1px solid ${styles.border}` }}>
                <Calendar size={13} /> Agendar cita
              </button>
            </Link>

            {/* Ver perfil */}
            <Link href={`/pacientes/${patient.id}/editar`}>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'white', color: styles.text, border: `1px solid ${styles.border}` }}>
                Ver perfil
              </button>
            </Link>

            {/* Enviar email */}
            {patient.email && !sent && (
              <button onClick={handleSend} disabled={sending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: styles.btn.bg }}>
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {sending ? 'Enviando...' : 'Enviar recordatorio'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}