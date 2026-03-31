import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== SUPERADMIN_EMAIL)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { userId, password } = await req.json()
  if (!userId || !password || password.length < 6)
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Sin service key' }, { status: 400 })

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const adminClient = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  const { error } = await adminClient.auth.admin.updateUserById(userId, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}