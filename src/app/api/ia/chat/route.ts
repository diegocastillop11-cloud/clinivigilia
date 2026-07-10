// app/api/ia/chat/route.ts
// Asistente IA médico para doctores — llama a Anthropic server-side (la key nunca llega al navegador)

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function buildSystemPrompt(doctor: any, patient: any): string {
  const doctorInfo = doctor
    ? `Eres el asistente de IA del Dr./Dra. ${doctor.full_name}, especialista en ${doctor.specialty?.replace('_', ' ') || 'medicina general'}.`
    : 'Eres un asistente médico de IA altamente especializado.'

  const patientContext = patient
    ? `
PACIENTE EN CONTEXTO:
- Nombre: ${patient.first_name} ${patient.last_name}
- RUT: ${patient.rut || 'No registrado'}
- Género: ${patient.gender || 'No especificado'}
- Fecha de nacimiento: ${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-CL') : 'No registrada'}
- Especialidad: ${patient.specialty?.replace('_', ' ')}
- Estado: ${patient.status}
- Notas clínicas: ${patient.notes || 'Sin notas registradas'}
`
    : 'No hay paciente seleccionado. Responde consultas médicas generales.'

  return `${doctorInfo}

Tu rol es ser el asistente médico más completo e inteligente posible. Debes:
1. Responder con precisión clínica y evidencia médica actualizada
2. Sugerir medicamentos con dosis, vía de administración y contraindicaciones cuando sea relevante
3. Analizar casos clínicos de forma sistemática
4. Alertar sobre situaciones de riesgo o interacciones importantes
5. Proporcionar información basada en guías clínicas actualizadas
6. Hablar siempre en español, con terminología médica apropiada pero explicaciones claras
7. Ser directo y útil, priorizando la eficiencia del médico

IMPORTANTE: Siempre incluir el disclaimer de que tus sugerencias son de apoyo y no reemplazan el juicio clínico del médico.

${patientContext}

Responde de forma estructurada cuando sea apropiado, usando secciones claras. Sé conciso pero completo.`
}

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const isSuperAdmin = user.email === SUPERADMIN_EMAIL

  if (!isSuperAdmin) {
    const { data: license } = await supabase
      .from('licenses').select('enabled_modules, status').eq('doctor_id', user.id).single()

    const hasAccess =
      license?.status === 'active' &&
      Array.isArray(license?.enabled_modules) &&
      (license.enabled_modules.includes('ai') || license.enabled_modules.includes('ia'))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Módulo IA no disponible en tu plan' }, { status: 403 })
    }
  }

  try {
    const { patientId, messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages requerido' }, { status: 400 })
    }

    const { data: doctor } = await supabase
      .from('doctors').select('*').eq('id', user.id).single()

    let patient = null
    if (patientId) {
      const { data } = await supabase
        .from('patients').select('*')
        .eq('id', patientId).eq('doctor_id', user.id).single()
      patient = data
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1000,
      system: buildSystemPrompt(doctor, patient),
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    })

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('') || 'No pude generar una respuesta.'

    return NextResponse.json({ reply: text })
  } catch (error) {
    console.error('Error en chat IA médico:', error)
    return NextResponse.json(
      { reply: 'Ocurrió un error al conectar con la IA. Por favor intenta nuevamente.' },
      { status: 200 }
    )
  }
}
