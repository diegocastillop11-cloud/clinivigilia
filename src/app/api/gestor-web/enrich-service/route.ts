// app/api/gestor-web/enrich-service/route.ts
// Enriquece el contexto de un servicio usando Claude + búsqueda web

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const { service_name, ia_context, ia_keywords } = await req.json()

    if (!service_name || !ia_context) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const prompt = `Eres un asistente especializado en salud y medicina. 
Un médico o clínica ha creado un servicio llamado "${service_name}" y te ha dado este contexto:

--- CONTEXTO DEL DOCTOR ---
${ia_context}
${ia_keywords?.length ? `\nPalabras clave asociadas: ${ia_keywords.join(', ')}` : ''}
---

Tu tarea:
1. Analiza el contexto entregado por el doctor
2. Complementa con información médica relevante, actualizada y confiable (puedes buscar en la web)
3. Genera un texto enriquecido que la IA del chatbot usará para responder preguntas de pacientes

El texto enriquecido debe incluir:
- Descripción clara del servicio y para qué sirve
- Indicaciones clínicas (cuándo se recomienda)
- Qué puede esperar el paciente durante y después
- Preguntas frecuentes complementarias que no haya cubierto el doctor
- Cualquier información relevante para tranquilizar o informar al paciente

Responde SOLO con el texto enriquecido, en español, sin introducción ni comentarios adicionales. Sé claro, empático y profesional.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools: [
        {
          type: 'web_search_20250305' as const,
          name: 'web_search',
        }
      ],
      messages: [
        { role: 'user', content: prompt }
      ],
    })

    // Extraer el texto de la respuesta
    const enriched = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n')

    return NextResponse.json({ enriched })

  } catch (error) {
    console.error('Error enriqueciendo servicio:', error)
    return NextResponse.json(
      { error: 'Error al procesar con IA' },
      { status: 500 }
    )
  }
}
