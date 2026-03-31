import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const TYPE_LABELS: Record<string, string> = {
  visita: 'Recordatorio de Visita',
  medicamento: 'Recordatorio de Medicamentos',
  post_consulta: 'Seguimiento Post-Consulta',
  examen: 'Alerta de Examen Pendiente',
}

function buildEmailHTML(opts: {
  patientName: string
  doctorName: string
  clinicName: string
  type: string
  message: string
  nextVisitDate?: string
  primaryColor?: string
}) {
  const color = opts.primaryColor || '#0ea5e9'
  const typeLabel = TYPE_LABELS[opts.type] || 'Recordatorio'
  const visitInfo = opts.nextVisitDate
    ? `<p style="margin:12px 0;padding:12px;background:#f0fdf4;border-radius:8px;border-left:4px solid #10b981;font-size:14px;color:#065f46;">
        📅 <strong>Próxima visita:</strong> ${new Date(opts.nextVisitDate).toLocaleDateString('es-CL', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:${color};padding:28px 32px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">${typeLabel}</p>
      <h1 style="margin:6px 0 0;color:white;font-size:22px;font-weight:800;">Hola, ${opts.patientName} 👋</h1>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
        ${opts.message}
      </p>
      ${visitInfo}
      <div style="margin:24px 0;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
        <p style="margin:0;font-size:13px;color:#64748b;">
          📍 Este mensaje fue enviado por <strong style="color:#1e293b;">${opts.doctorName}</strong>
          ${opts.clinicName ? `<br>🏥 ${opts.clinicName}` : ''}
        </p>
      </div>
      <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">
        Si tienes dudas o necesitas reagendar, contacta directamente a tu médico.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
        Enviado por ClinivigilIA · Sistema de Gestión Médica
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { patientId, followupId, type, message, nextVisitDate, reminderId } = body

  // Obtener datos del paciente
  const { data: patient } = await supabase
    .from('patients').select('*').eq('id', patientId).single()
  if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
  if (!patient.email) return NextResponse.json({ error: 'El paciente no tiene email registrado' }, { status: 400 })

  // Obtener datos del doctor
  const { data: doctor } = await supabase
    .from('doctors').select('full_name, clinic_name').eq('id', user.id).single()

  // Obtener color de la clínica
  const { data: clinicSettings } = await supabase
    .from('clinic_settings').select('primary_color').eq('doctor_id', user.id).maybeSingle()

  const patientName = `${patient.first_name} ${patient.last_name}`
  const doctorName = doctor?.full_name ? `Dr. ${doctor.full_name}` : 'Tu médico'
  const clinicName = doctor?.clinic_name ?? ''
  const primaryColor = clinicSettings?.primary_color ?? '#0ea5e9'

  const typeLabel = TYPE_LABELS[type] || 'Recordatorio'

  try {
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${clinicName || 'ClinivigilIA'} <onboarding@resend.dev>`,
      to: [patient.email],
      subject: `${typeLabel} — ${patientName}`,
      html: buildEmailHTML({
        patientName,
        doctorName,
        clinicName,
        type,
        message,
        nextVisitDate,
        primaryColor,
      }),
    })

    if (emailError) return NextResponse.json({ error: emailError.message }, { status: 400 })

    // Registrar en followups
    if (followupId) {
      await supabase.from('followups').update({
        last_reminder_sent: new Date().toISOString(),
        reminder_count: supabase.rpc('increment', { x: 1 }),
      }).eq('id', followupId)

      // Registrar como followup tipo email_enviado
      await supabase.from('followups').insert({
        patient_id: patientId,
        doctor_id: user.id,
        type: 'email_enviado',
        title: `Email enviado: ${typeLabel}`,
        content: message,
        is_alert: false,
      })
    }

    // Si viene de un reminder automático, actualizar next_send_at
    if (reminderId) {
      const { data: reminder } = await supabase
        .from('reminders').select('send_every_days').eq('id', reminderId).single()
      if (reminder) {
        const nextSend = new Date()
        nextSend.setDate(nextSend.getDate() + (reminder.send_every_days ?? 7))
        await supabase.from('reminders').update({
          last_sent_at: new Date().toISOString(),
          next_send_at: nextSend.toISOString(),
          sent_count: supabase.rpc('increment', { x: 1 }),
        }).eq('id', reminderId)
      }
    }

    return NextResponse.json({ success: true, emailId: emailData?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}