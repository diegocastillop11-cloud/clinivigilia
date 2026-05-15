import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre_promocion, descuento, descripcion, emails } = body

    if (!nombre_promocion || !descuento || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const discountValue = parseFloat(descuento)
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      return NextResponse.json({ error: 'Descuento debe ser un número entre 0 y 100' }, { status: 400 })
    }

    // Enviar emails a todos los contactos
    const emailPromises = emails.map(contact => {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Promoción especial</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header con gradiente -->
              <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">¡Promoción Especial!</h1>
              </div>

              <!-- Contenido -->
              <div style="padding: 40px 30px;">
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                  Hola <strong>${contact.nombre}</strong>,
                </p>

                <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Tenemos una oferta especial para ti:
                </p>

                <!-- Tarjeta de promoción -->
                <div style="background: linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(22,163,74,0.05) 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; color: #16a34a; font-size: 13px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Oferta limitada</p>
                  <h2 style="margin: 0 0 8px 0; color: #15803d; font-size: 36px; font-weight: bold;">${discountValue}% OFF</h2>
                  <p style="margin: 0; color: #3d7d4d; font-size: 16px; font-weight: 600;">${nombre_promocion}</p>
                </div>

                ${descripcion ? `
                  <div style="background: #f3f4f6; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
                    <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${descripcion}</p>
                  </div>
                ` : ''}

                <!-- CTA -->
                <a href="https://clinivigilia.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Ver detalles de la promoción
                </a>

                <p style="margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                  Esta promoción fue enviada especialmente para ti. Si tienes dudas o deseas más información, no dudes en contactarnos.
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © 2026 ClinivigilIA. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </body>
        </html>
      `

      return resend.emails.send({
        from: 'noreply@clinivigilia.com',
        to: contact.email,
        subject: `¡${discountValue}% de descuento en ${nombre_promocion}!`,
        html: htmlContent,
      })
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.data?.id).length

    if (successCount === 0) {
      return NextResponse.json({ error: 'No se pudieron enviar los emails' }, { status: 500 })
    }

    return NextResponse.json({ sent: successCount, total: emails.length })
  } catch (err) {
    console.error('send-promotion API error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
