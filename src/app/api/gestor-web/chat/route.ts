// app/api/gestor-web/chat/route.ts
// Chat IA con agendamiento real en tablas patients + appointments

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const freshTime = new Date().toLocaleString('es-CL')

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

    // ─── Disponibilidad real ─────────────────────────────
    const today = new Date()
    const jsToOur = (d: number) => d === 0 ? 6 : d - 1

    const { data: availability } = await supabase
      .from('web_availability')
      .select('*')
      .eq('doctor_id', doctor_id)
      .eq('active', true)

    const { data: bookedAppts } = await supabaseAdmin
      .from('appointments')
      .select('scheduled_at')
      .eq('doctor_id', doctor_id)
      .in('status', ['programada', 'confirmada'])
      .gte('scheduled_at', today.toISOString())

    // Generar slots disponibles próximos 14 días
    const availableSlots: { date: string; dayName: string; slots: string[] }[] = []

    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const ourDay = jsToOur(date.getDay())
      const dateStr = date.toISOString().split('T')[0]

      const dayAvail = availability?.find((a: any) => a.day_of_week === ourDay)
      if (!dayAvail?.enabled_slots?.length) continue

      const bookedTimes = bookedAppts
        ?.filter((a: any) => a.scheduled_at?.startsWith(dateStr))
        .map((a: any) => a.scheduled_at?.slice(11, 16)) || []

      const freeSlots = dayAvail.enabled_slots.filter(
        (s: string) => !bookedTimes.includes(s)
      )
      if (!freeSlots.length) continue

      const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
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
    const systemPrompt = `Eres el asistente de agendamiento (actualizado: ${freshTime}) de la clínica/consulta con slug "${slug}". Eres amable, conciso y eficiente.

## SERVICIOS DISPONIBLES:
${servicesContext || 'Sin servicios configurados.'}

## HORARIOS DISPONIBLES (próximos 14 días):
${slotsContext}

## FLUJO DE AGENDAMIENTO — sigue este orden EXACTO:
1. Cuando el paciente quiera agendar, explica el servicio BREVEMENTE (2 oraciones máximo)
2. Muestra los horarios disponibles inmediatamente
3. Cuando elija día y hora, pide los datos en este orden:
   a. Nombre completo (nombre Y apellido)
   b. RUT (formato: 12.345.678-9)
   c. Email
   d. Teléfono
4. Muestra un resumen con todos los datos y pregunta: "¿Confirmas estos datos? Responde **sí** para agendar."
5. SOLO cuando el paciente responda "sí", "confirmo", "correcto", "ok" o similar, incluye al final de tu respuesta (en línea separada):
   AGENDAR|nombre|rut|email|telefono|fecha|hora|servicio_nombre|duracion_min

## REGLAS IMPORTANTES:
- Sé MUY conciso. Máximo 3-4 oraciones por respuesta
- NO repitas información ya dada en mensajes anteriores
- NO mandes al paciente a buscar botones — TÚ gestionas el agendamiento
- Muestra horarios así: "📅 **Lunes 30 de marzo:** 9:00 - 10:00 - 11:00"
- El RUT es OBLIGATORIO. Si no lo da, pídelo amablemente
- NUNCA incluyas AGENDAR|... antes de que el paciente confirme con "sí"
- Si el paciente dice que los datos están mal, corrígelos y vuelve a pedir confirmación
- Habla siempre en español, tono cálido y profesional
- Los horarios mostrados arriba son los ÚNICOS disponibles en este momento. Si un paciente elige un horario que no aparece en la lista, indícale que ese horario ya no está disponible y muéstrale los que sí están.
- NUNCA ofrezcas horarios que no estén en la lista de HORARIOS DISPONIBLES de este prompt`

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
      /AGENDAR\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)/
    )

    function formatRut(rut: string): string {
      const clean = rut.replace(/[^0-9kK]/g, '')
      if (clean.length < 2) return rut
      const body = clean.slice(0, -1)
      const dv   = clean.slice(-1).toUpperCase()
      const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return `${formatted}-${dv}`
    }

    if (bookingMatch) {
      const [, patientName, patientRut, patientEmail, patientPhone, apptDate, apptTime, serviceName, durationStr] = bookingMatch

      const nameParts   = patientName.trim().split(' ')
      const firstName   = nameParts[0] || patientName.trim()
      const lastName    = nameParts.slice(1).join(' ') || 'Sin apellido'
      const durationMin = parseInt(durationStr) || 30
      const cleanRut = formatRut(patientRut.trim())

      const matchedService = services.find((s: any) =>
        s.name.toLowerCase().includes(serviceName.trim().toLowerCase()) ||
        serviceName.trim().toLowerCase().includes(s.name.toLowerCase())
      )

      // ── 1. Buscar o crear paciente por RUT (con admin) ──
      let patientId: string | null = null

      const { data: existingPatient } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('doctor_id', doctor_id)
        .eq('rut', cleanRut)
        .maybeSingle()

      if (existingPatient) {
        patientId = existingPatient.id
        await supabaseAdmin.from('patients').update({
          email: patientEmail.trim() || null,
          phone: patientPhone.trim() || null,
        }).eq('id', patientId)
      } else {
        const { data: newPatient, error: patientError } = await supabaseAdmin
          .from('patients')
          .insert({
            doctor_id,
            first_name: firstName,
            last_name:  lastName,
            rut:        cleanRut,
            email:      patientEmail.trim() || null,
            phone:      patientPhone.trim() || null,
            status:     'activo',
            specialty:  'medicina_general',   // ← AGREGAR ESTA LÍNEA
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

      // ── 2.  Crear cita en appointments (con admin) ───────
      // ── 2.1 Verificar que el slot no esté ocupado ────────────
      const scheduledAt = `${apptDate.trim()}T${apptTime.trim()}:00`

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
          reply: cleanReply + '\n\n⚠️ Lo siento, ese horario acaba de ser reservado por otro paciente. Estos son los horarios que aún están disponibles:\n\n' +
            availableSlots
              .filter(d => d.date === apptDate.trim())
              .map(d => `📅 **${d.dayName}:** ${d.slots.join(' - ')}`)
              .join('\n') +
            '\n\n¿Cuál prefieres?',
        })
      }

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

      // ── 3. Respuesta de éxito ────────────────────────────
      const cleanReply = fullReply.replace(/AGENDAR\|.+/, '').trim()
      const dateFormatted = new Date(apptDate.trim() + 'T12:00:00').toLocaleDateString('es-CL', {
        weekday: 'long', day: 'numeric', month: 'long',
      })

      return NextResponse.json({
        reply: `✅ **¡Cita agendada exitosamente!**\n\n📋 **Resumen:**\n• **Paciente:** ${patientName.trim()}\n• **RUT:** ${cleanRut}\n• **Servicio:** ${serviceName.trim()}\n• **Fecha:** ${dateFormatted}\n• **Hora:** ${apptTime.trim()}\n\nTe esperamos. Si necesitas cancelar o reagendar contáctanos. ¡Hasta pronto! 👋`,
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
