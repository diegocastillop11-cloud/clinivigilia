import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Verificar que es admin de la clínica
  const { data: clinic } = await supabase
    .from('clinics').select('*').eq('admin_id', user.id).single()
  if (!clinic) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { full_name, email, password, specialty, phone, rut, mode, clinic_id } = body

  if (clinic.id !== clinic_id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Verificar límite de médicos
  const { count } = await supabase
    .from('clinic_doctors')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinic.id)

  if ((count ?? 0) >= clinic.max_doctors) {
    return NextResponse.json({ error: `Límite de ${clinic.max_doctors} médicos alcanzado. Actualiza tu plan.` }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurada' }, { status: 400 })

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const adminClient = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  // Crear usuario
  let userId: string
  if (mode === 'magic_link') {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name }
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    userId = data.user.id
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    userId = data.user.id
  }

  // Crear perfil en doctors
  await adminClient.from('doctors').upsert({
    id: userId,
    full_name,
    email,
    specialty: specialty || null,
    phone: phone || null,
    rut: rut || null,
    clinic_id: clinic.id,
    account_type: 'clinic_doctor',
  }, { onConflict: 'id' })

  // Vincular a la clínica
  await adminClient.from('clinic_doctors').insert({
    clinic_id: clinic.id,
    doctor_id: userId,
    role: 'doctor',
  })

  // Crear licencia heredando el plan de la clínica
  await adminClient.from('licenses').upsert({
    doctor_id: userId,
    plan: clinic.plan,
    status: clinic.status,
    expires_at: clinic.expires_at,
    enabled_modules: clinic.enabled_modules,
    notes: `Médico de clínica: ${clinic.name}`,
  }, { onConflict: 'doctor_id' })

  return NextResponse.json({ success: true, userId })
}