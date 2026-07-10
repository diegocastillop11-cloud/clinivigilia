// app/api/admin/ia/chat/route.ts
// Chat IA privado del superadmin — llama a Anthropic server-side (la key nunca llega al navegador)

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function buildSystemPrompt(platformData: unknown): string {
  return `Eres el asistente IA privado y exclusivo de Diego Castillo, fundador y superadmin de ClinivigilIA — una plataforma SaaS médica chilena.

Tu rol es ser su analista de negocio inteligente. Tienes acceso completo y en tiempo real a todos los datos de la plataforma.

DATOS ACTUALES DE LA PLATAFORMA (actualizados al momento):
${JSON.stringify(platformData, null, 2)}

TUS CAPACIDADES:
1. Analizar el estado de todos los clientes (doctores y clínicas)
2. Identificar oportunidades de negocio y upsell
3. Detectar clientes en riesgo (suspendidos, sin actividad)
4. Generar insights sobre uso de módulos y planes
5. Responder preguntas específicas sobre cualquier cliente
6. Analizar métricas globales de pacientes y citas
7. Sugerir estrategias de crecimiento

REGLAS:
- Habla siempre en español, tono profesional pero cercano
- Sé directo y accionable — no des respuestas genéricas
- Cuando menciones clientes, usa sus nombres reales de los datos
- Si te preguntan por un cliente específico, busca en los datos y da info exacta
- Usa emojis con moderación para hacer más legible la respuesta
- Formatea bien con secciones cuando sea apropiado

Eres el asistente más valioso de Diego para tomar decisiones sobre su negocio.`
}

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (user.email !== SUPERADMIN_EMAIL) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  try {
    const { platformData, messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages requerido' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      system: buildSystemPrompt(platformData),
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    })

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('') || 'No pude generar respuesta.'

    return NextResponse.json({ reply: text })
  } catch (error) {
    console.error('Error en chat IA admin:', error)
    return NextResponse.json(
      { reply: 'Lo siento, hubo un error. Por favor intenta de nuevo.' },
      { status: 200 }
    )
  }
}
