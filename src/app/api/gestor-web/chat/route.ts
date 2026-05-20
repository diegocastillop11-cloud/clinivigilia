// app/api/gestor-web/chat/route.ts
// Chat IA con agendamiento real en tablas patients + appointments

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ─── Helpers ─────────────────────────────────────────────
function formatRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, '')
  if (clean.length < 2) return rut
  const body = clean.slice(0, -1)
  const dv   = clean.slice(-1).toUpperCase()
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const { doctor_id, slug, messages, services } = await req.json()

    // Cliente normal para lecturas (con RLS)
    const supabase = createClient() as any

    // Cliente admin para escrituras desde landing (sin RLS)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ) as any

    // ─── Disponibilidad real (por fecha específica) ──────
    const today = new Date()
    const jsToOur = (d: number) => d === 0 ? 6 : d - 1
    const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

    // Obtener fechas de los próximos 14 días
    const dateStrings = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return d.toISOString().split('T')[0]
    })

    const { data: availability } = await supabaseAdmin
      .from('web_availability_dates')
      .select('*')
      .eq('doctor_id', doctor_id)
      .eq('active', true)
      .in('date', dateStrings)

    const { data: bookedAppts } = await supabaseAdmin
      .from('appointments')
      .select('scheduled_at')
      .eq('doctor_id', doctor_id)
      .in('status', ['programada', 'confirmada'])
      .gte('scheduled_at', today.toISOString())

    // Construir slots disponibles desde fechas específicas
    const availableSlots: { date: string; dayName: string; slots: string[] }[] = []

    for (const dateStr of dateStrings) {
      const dayAvail = availability?.find((a: any) => a.date === dateStr)
      if (!dayAvail?.enabled_slots?.length) continue

      const bookedTimes = bookedAppts
        ?.filter((a: any) => a.scheduled_at?.startsWith(dateStr))
        .map((a: any) => a.scheduled_at?.slice(11, 16)) || []

      const freeSlots = dayAvail.enabled_slots.filter(
        (s: string) => !bookedTimes.includes(s)
      )
      if (!freeSlots.length) continue

      const date = new Date(dateStr + 'T12:00:00')
      const ourDay = jsToOur(date.getDay())
      const dateFormatted = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })

      availableSlots.push({
        date: dateStr,
        dayName: `${DAY_NAMES[ourDay]} ${dateFormatted}`,
        slots: freeSlots,
      })
      if (availableSlots.length >= 5) break
    }

    // ─── Contexto de servicios ───────────────────────────
    const servicesContext = services
      .map((s: any) =>
        `- **${s.name}** (${s.duration_min} min${s.price_from ? `, $${s.price_from.toLocaleString('es-CL')}` : ''}${s.price_label ? `, ${s.price_label}` : ''}): ${s.ia_context || s.short_desc || 'Sin descripción'}`
      ).join('\n')

    const slotsContext = availableSlots.length > 0
      ? availableSlots.map(d => `${d.dayName}: ${d.slots.join(' - ')}`).join('\n')
      : 'No hay horarios disponibles en los próximos 14 días.'

    // ─── System prompt ───────────────────────────────────
    const systemPrompt = `Eres el asistente de agendamiento de la clínica/consulta con slug "${slug}". Eres amable, conciso y eficiente.

## SERVICIOS DISPONIBLES:
${servicesContext || 'Sin servicios configurados.'}

## HORARIOS DISPONIBLES (próximos 14 días):
${slotsContext}

## FLUJO DE AGENDAMIENTO — sigue este orden EXACTO:
1. Cuando el paciente quiera agendar, explica el servicio BREVEMENTE (2 oraciones máximo)
2. Muestra los horarios disponibles inmediatamente
3. Cuando elija día y hora, pide TODOS los datos en UN SOLO mensaje:
   "Para confirmar tu cita necesito los siguientes datos:
   • Nombre completo (nombre y apellido)
   • Email
   • Teléfono"
   Espera que el paciente los envíe todos juntos antes de continuar. Si no los envia todos juntos pidele lo que falta.
4. Muestra un resumen con todos los datos y pregunta: "¿Confirmas estos datos? Responde **sí** para agendar."
5. SOLO cuando el paciente responda "sí", "confirmo", "correcto", "ok" o similar, incluye al final de tu respuesta (en línea separada):
   AGENDAR|nombre|email|telefono|YYYY-MM-DD|HH:MM|servicio_nombre|duracion_min

## REGLAS IMPORTANTES:
- Sé MUY conciso. Máximo 3-4 oraciones por respuesta
- NO repitas información ya dada en mensajes anteriores
- NO mandes al paciente a buscar botones — TÚ gestionas el agendamiento
- Muestra horarios así: "📅 **Lunes 30 de marzo:** 9:00 - 10:00 - 11:00"
- NUNCA incluyas AGENDAR|... antes de que el paciente confirme con "sí"
- Si el paciente dice que los datos están mal, corrígelos y vuelve a pedir confirmación
- Habla siempre en español, tono cálido y profesional
- Los horarios mostrados arriba son los ÚNICOS disponibles en este momento. Si un paciente elige un horario que no aparece en la lista, indícale que ese horario ya no está disponible y muéstrale los que sí están.
- NUNCA ofrezcas horarios que no estén en la lista de HORARIOS DISPONIBLES de este prompt
- La fecha en AGENDAR|... SIEMPRE debe ser en formato YYYY-MM-DD (ej: 2026-04-02), NUNCA en texto`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    })

    const fullReply = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    // ─── Detectar comando de agendamiento ────────────────
    const bookingMatch = fullReply.match(
      /AGENDAR\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)/
    )

    if (bookingMatch) {
      const [, patientName, patientEmail, patientPhone, apptDate, apptTime, serviceName, durationStr] = bookingMatch

      const nameParts   = patientName.trim().split(' ')
      const firstName   = nameParts[0] || patientName.trim()
      const lastName    = nameParts.slice(1).join(' ') || 'Sin apellido'
      const durationMin = parseInt(durationStr) || 30

      const matchedService = services.find((s: any) =>
        s.name.toLowerCase().includes(serviceName.trim().toLowerCase()) ||
        serviceName.trim().toLowerCase().includes(s.name.toLowerCase())
      )

      // ── 1. Buscar o crear paciente por email ─────────────
      let patientId: string | null = null
      const cleanEmail = patientEmail.trim().toLowerCase()

      const { data: existingPatient } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('doctor_id', doctor_id)
        .eq('email', cleanEmail)
        .maybeSingle()

      if (existingPatient) {
        patientId = existingPatient.id
        await supabaseAdmin.from('patients').update({
          phone: patientPhone.trim() || null,
        }).eq('id', patientId)
      } else {
        const { data: newPatient, error: patientError } = await supabaseAdmin
          .from('patients')
          .insert({
            doctor_id,
            first_name: firstName,
            last_name:  lastName,
            email:      cleanEmail || null,
            phone:      patientPhone.trim() || null,
            status:     'activo',
            specialty:  'medicina_general',
            notes:      `Paciente registrado desde landing web (${slug})`,
          })
          .select('id')
          .single()

        if (patientError) {
          console.error('Error creando paciente:', patientError)
        } else {
          patientId = newPatient.id
        }
      }

      if (!patientId) {
        const cleanReply = fullReply.replace(/AGENDAR\|.+/, '').trim()
        return NextResponse.json({
          reply: cleanReply + '\n\nHubo un problema al registrar al paciente. Por favor contáctanos directamente.',
        })
      }

      // ── 2. Verificar slot disponible ────────────────────
      let cleanDate = apptDate.trim()
      if (cleanDate.includes(' ') && !cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const matched = availableSlots.find(s =>
          s.dayName.toLowerCase().includes(cleanDate.toLowerCase().split(' ').slice(-2).join(' '))
        )
        if (matched) cleanDate = matched.date
      }

      // Forzar año correcto si la fecha quedó en el pasado
      if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const currentYear = new Date().getFullYear()
        const dateYear = parseInt(cleanDate.slice(0, 4))
        if (dateYear < currentYear) {
          cleanDate = cleanDate.replace(/^\d{4}/, currentYear.toString())
        }
      }

      const scheduledAt = `${cleanDate}T${apptTime.trim()}:00`

      const { data: slotTaken } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctor_id)
        .eq('scheduled_at', scheduledAt)
        .in('status', ['programada', 'confirmada'])
        .maybeSingle()

      if (slotTaken) {
        const cleanReply = fullReply.replace(/AGENDAR\|.+/, '').trim()
        return NextResponse.json({
          reply: cleanReply + '\n\n⚠️ Lo siento, ese horario acaba de ser reservado. Estos son los horarios disponibles:\n\n' +
            availableSlots
              .filter(d => d.date === apptDate.trim())
              .map(d => `📅 **${d.dayName}:** ${d.slots.join(' - ')}`)
              .join('\n') +
            '\n\n¿Cuál prefieres?',
        })
      }

      // ── 3. Crear cita en appointments ───────────────────
      const { data: appt, error: apptError } = await supabaseAdmin
        .from('appointments')
        .insert({
          doctor_id,
          patient_id:   patientId,
          scheduled_at: scheduledAt,
          duration_min: durationMin,
          type:         'primera_vez',
          status:       'programada',
          notes:        `Cita agendada desde landing web (${slug}) mediante asistente IA${matchedService ? ` — Servicio: ${matchedService.name}` : ''}`,
        })
        .select()
        .single()

      if (apptError) {
        console.error('Error creando cita:', apptError)
        const cleanReply = fullReply.replace(/AGENDAR\|.+/, '').trim()
        return NextResponse.json({
          reply: cleanReply + '\n\nHubo un problema al agendar la cita. Por favor contáctanos directamente.',
        })
      }

      // ── 4. Respuesta de éxito ────────────────────────────
      // Usar new Date(y,m,d) para evitar problemas de timezone
      const [cy, cm, cd] = cleanDate.split('-').map(Number)
      const dateObj = new Date(cy, cm - 1, cd)
      const dateFormatted = dateObj.toLocaleDateString('es-CL', {
        weekday: 'long', day: 'numeric', month: 'long',
      })

      return NextResponse.json({
        reply: `✅ **¡Cita agendada exitosamente!**\n\n📋 **Resumen:**\n• **Paciente:** ${patientName.trim()}\n• **Servicio:** ${serviceName.trim()}\n• **Fecha:** ${dateFormatted}\n• **Hora:** ${apptTime.trim()}\n\nTe esperamos. Si necesitas cancelar o reagendar contáctanos. ¡Hasta pronto! 👋`,
        booked: true,
        appointment: appt,
      })
    }

    const cleanReply = fullReply.replace(/AGENDAR\|.+/, '').trim()
    return NextResponse.json({ reply: cleanReply })

  } catch (error) {
    console.error('Error en chat IA landing:', error)
    return NextResponse.json(
      { reply: 'Lo siento, hubo un error. Por favor intenta de nuevo o contáctanos directamente.' },
      { status: 200 }
    )
  }
}
