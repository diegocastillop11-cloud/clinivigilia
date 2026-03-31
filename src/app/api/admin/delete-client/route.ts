import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (user.email !== SUPERADMIN_EMAIL) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurada' }, { status: 400 })

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const adminClient = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  // 1. Eliminar datos relacionados
  await adminClient.from('licenses').delete().eq('doctor_id', userId)
  await adminClient.from('clinic_doctors').delete().eq('doctor_id', userId)
  await adminClient.from('followups').delete().eq('doctor_id', userId)
  await adminClient.from('appointments').delete().eq('doctor_id', userId)
  await adminClient.from('patients').delete().eq('doctor_id', userId)
  await adminClient.from('clinics').delete().eq('admin_id', userId)
  await adminClient.from('doctors').delete().eq('id', userId)

  // 2. Eliminar de auth.users — esto es lo que faltaba
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}