import nodemailer from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clinivigilia.vercel.app'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function welcomeTemplate({
  name,
  email,
  password,
  type,
}: {
  name: string
  email: string
  password?: string
  type: 'doctor' | 'clinic'
}) {
  const loginUrl = `${APP_URL}/auth/login`
  const roleLabel = type === 'clinic' ? 'Administrador de Clínica' : 'Doctor'
  const emoji = type === 'clinic' ? '🏥' : '👨‍⚕️'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenido a Clinivigilia</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:900;color:#f1f5f9;">🩺 Clinivigilia</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1e293b;border-radius:24px;border:1px solid #334155;overflow:hidden;">
              <div style="height:4px;background:linear-gradient(90deg,#818cf8,#6366f1,#a78bfa);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px;">

                <!-- Icon -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:72px;height:72px;background:rgba(129,140,248,0.15);border-radius:20px;display:inline-block;text-align:center;line-height:72px;font-size:36px;">
                      ${emoji}
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:26px;font-weight:900;color:#f1f5f9;">
                      ¡Bienvenido a Clinivigilia!
                    </h1>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
                      Hola <strong style="color:#a5b4fc;">${name}</strong>, tu cuenta de
                      <strong style="color:#f1f5f9;">${roleLabel}</strong> ha sido creada exitosamente.
                    </p>
                  </td>
                </tr>

                <!-- Credentials -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <div style="background:#0f172a;border-radius:16px;border:1px solid #334155;padding:24px;">
                      <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">
                        Tus credenciales de acceso
                      </p>
                      <p style="margin:0 0 4px;font-size:11px;color:#475569;font-weight:600;">CORREO ELECTRÓNICO</p>
                      <p style="margin:0 0 16px;font-size:14px;color:#f1f5f9;font-weight:600;">${email}</p>
                      ${password ? `
                      <p style="margin:0 0 4px;font-size:11px;color:#475569;font-weight:600;">CONTRASEÑA</p>
                      <p style="margin:0 0 8px;font-size:14px;color:#f1f5f9;font-weight:700;background:#1e293b;padding:8px 12px;border-radius:8px;display:inline-block;">${password}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#475569;">Te recomendamos cambiarla después de ingresar</p>
                      ` : ''}
                    </div>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${loginUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#818cf8,#6366f1);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:14px;">
                      Ingresar a Clinivigilia →
                    </a>
                  </td>
                </tr>

                <!-- Features -->
                <tr>
                  <td>
                    <div style="background:#0f172a;border-radius:16px;border:1px solid #1e293b;padding:20px;">
                      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Con tu cuenta puedes</p>
                      <p style="margin:4px 0;font-size:13px;color:#94a3b8;">👥 Gestionar pacientes y fichas clínicas</p>
                      <p style="margin:4px 0;font-size:13px;color:#94a3b8;">📅 Agendar y controlar citas</p>
                      <p style="margin:4px 0;font-size:13px;color:#94a3b8;">📋 Registrar seguimiento clínico</p>
                      <p style="margin:4px 0;font-size:13px;color:#94a3b8;">🤖 Usar el asistente de IA médica</p>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#334155;">
                Este correo fue enviado automáticamente por Clinivigilia.<br/>
                Si tienes problemas para ingresar, contacta a tu administrador.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail({
  name,
  email,
  password,
  type,
}: {
  name: string
  email: string
  password?: string
  type: 'doctor' | 'clinic'
}) {
  try {
    await transporter.sendMail({
      from: `"Clinivigilia" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `¡Bienvenido a Clinivigilia, ${name.split(' ')[0]}! 🩺`,
      html: welcomeTemplate({ name, email, password, type }),
    })
    console.log(`✅ Email de bienvenida enviado a ${email}`)
  } catch (err) {
    console.error('❌ Error enviando email de bienvenida:', err)
  }
}