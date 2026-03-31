import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/welcome-email'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (user.email !== SUPERADMIN_EMAIL) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { email, password, full_name, specialty, clinic_name, phone, plan, status, expires_at, enabled_modules, notes, mode } = body

  if (mode === 'magic_link') {
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name }
    }).catch(() => ({ error: null })) as any

    if (error) {
      const { error: otpError } = await adminClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login` }
      })
      if (otpError) return NextResponse.json({ error: otpError.message }, { status: 400 })
    }

    const { data: newUsers } = await adminClient
      .from('doctors').select('id').eq('full_name', full_name).order('created_at', { ascending: false }).limit(1)

    // Email de bienvenida (sin contraseña — usará magic link)
    await sendWelcomeEmail({ name: full_name, email, type: 'doctor' })

    return NextResponse.json({ success: true, userId: newUsers?.[0]?.id ?? null, mode: 'magic_link' })
  }

  // with_password
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local'
    }, { status: 400 })
  }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const adminClient = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })

  const userId = newUser.user.id

  await adminClient.from('doctors').upsert({
    id: userId, full_name,
    specialty: specialty || null,
    clinic_name: clinic_name || null,
    phone: phone || null,
    created_by: user.id,
  }, { onConflict: 'id' })

  await adminClient.from('licenses').upsert({
    doctor_id: userId,
    plan: plan || 'free',
    status: status || 'active',
    expires_at: expires_at || null,
    enabled_modules: enabled_modules || ['patients','appointments','followups'],
    notes: notes || null,
  }, { onConflict: 'doctor_id' })

  // Email de bienvenida con contraseña
  await sendWelcomeEmail({ name: full_name, email, password, type: 'doctor' })

  return NextResponse.json({ success: true, userId, mode: 'with_password' })
}