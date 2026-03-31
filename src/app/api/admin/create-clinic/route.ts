import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/welcome-email'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (user.email !== SUPERADMIN_EMAIL) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const {
    clinic_name, email, password, admin_name,
    phone, address, plan, status, max_doctors,
    expires_at, enabled_modules, notes, mode
  } = body

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurada' }, { status: 400 })

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const adminClient = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  let userId: string

  if (mode === 'magic_link') {
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: admin_name }
    })
    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 })
    userId = invited.user.id
  } else {
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: admin_name },
    })
    if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })
    userId = newUser.user.id
  }

  await adminClient.from('doctors').upsert({
    id: userId,
    full_name: admin_name,
    phone: phone || null,
    account_type: 'clinic_admin',
    created_by: user.id,
  }, { onConflict: 'id' })

  const { data: clinic, error: clinicError } = await adminClient.from('clinics').insert({
    name: clinic_name,
    slug: slugify(clinic_name),
    email,
    phone: phone || null,
    address: address || null,
    admin_id: userId,
    plan: plan || 'free',
    status: status || 'active',
    max_doctors: parseInt(max_doctors) || 5,
    enabled_modules: enabled_modules || ['patients','appointments','followups'],
    notes: notes || null,
    expires_at: expires_at || null,
  }).select().single()

  if (clinicError) return NextResponse.json({ error: clinicError.message }, { status: 400 })

  await adminClient.from('doctors').update({
    clinic_id: clinic.id,
  }).eq('id', userId)

  await adminClient.from('licenses').upsert({
    doctor_id: userId,
    plan: plan || 'free',
    status: status || 'active',
    expires_at: expires_at || null,
    enabled_modules: enabled_modules || ['patients','appointments','followups'],
    notes: `Admin de clínica: ${clinic_name}`,
  }, { onConflict: 'doctor_id' })

  // Email de bienvenida
  await sendWelcomeEmail({
    name: admin_name,
    email,
    password: mode === 'with_password' ? password : undefined,
    type: 'clinic',
  })

  return NextResponse.json({
    success: true,
    clinicId: clinic.id,
    adminId: userId,
    mode,
  })
}