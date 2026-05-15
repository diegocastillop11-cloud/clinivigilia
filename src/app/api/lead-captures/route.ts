import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL o clave no configurada')
  }
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, nombre, email, telefono, answers } = body

    if (!slug || !nombre || !email || !telefono) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: leadMagnet, error: lmError } = await supabase
      .from('lead_magnets')
      .select('id, pdf_path, questions')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (lmError || !leadMagnet) {
      return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
    }

    // Validar preguntas requeridas
    const questions: any[] = leadMagnet.questions ?? []
    for (const q of questions) {
      if (q.required && !answers?.[q.id]?.trim()) {
        return NextResponse.json(
          { error: `La pregunta "${q.label}" es obligatoria` },
          { status: 400 }
        )
      }
    }

    const answerFields = answers && typeof answers === 'object' ? answers : {}
    const insertPayload = {
      lead_magnet_id: leadMagnet.id,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      answers: answers ?? {},
      ...answerFields,
    }

    const { error: insertError } = await supabase
      .from('lead_captures')
      .insert(insertPayload)

    if (insertError) {
      console.error('lead_captures insert error:', insertError, { slug, nombre, email, telefono, answers })
      return NextResponse.json({ error: insertError.message || 'Error al guardar datos' }, { status: 500 })
    }

    if (!leadMagnet.pdf_path) {
      return NextResponse.json({ error: 'El PDF aún no está disponible' }, { status: 422 })
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from('lead-pdfs')
      .createSignedUrl(leadMagnet.pdf_path, 7 * 24 * 60 * 60)

    if (signedError || !signed) {
      console.error('signed URL error:', signedError)
      return NextResponse.json({ error: 'Error al generar enlace de descarga' }, { status: 500 })
    }

    return NextResponse.json({ download_url: signed.signedUrl })
  } catch (err) {
    console.error('lead-captures API error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
