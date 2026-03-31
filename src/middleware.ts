import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPERADMIN_EMAIL = 'diego.castillo.p11@gmail.com'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── No autenticado ──────────────────────────────────────────
  if (!user) {
    const isPrivate =
      path.startsWith('/dashboard') ||
      path.startsWith('/admin') ||
      path.startsWith('/clinica') ||
      path.startsWith('/pacientes') ||
      path.startsWith('/citas') ||
      path.startsWith('/seguimiento') ||
      path.startsWith('/ia')
    if (isPrivate) return NextResponse.redirect(new URL('/auth/login', request.url))
    return supabaseResponse
  }

  // ── Superadmin — detectado por email, sin consultar DB ─────
  if (user.email === SUPERADMIN_EMAIL) {
    if (path === '/' || path.startsWith('/auth') || path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return supabaseResponse
  }

  // ── Detectar tipo de cuenta desde user_metadata primero ────
  // Fallback: consultar tabla doctors
  const metaAccountType = user.user_metadata?.account_type as string | undefined

  let accountType = metaAccountType

  if (!accountType) {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('account_type')
      .eq('id', user.id)
      .maybeSingle()
    accountType = doctor?.account_type ?? 'independent'
  }

  const isClinicAdmin = accountType === 'clinic_admin'

  // ── Admin de clínica ────────────────────────────────────────
  if (isClinicAdmin) {
    if (path === '/' || path.startsWith('/auth') || path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/clinica/admin', request.url))
    }
    if (path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/clinica/admin', request.url))
    }
    return supabaseResponse
  }

  // ── Doctor independiente o médico de clínica ────────────────
  if (path === '/' || path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (path.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (path.startsWith('/clinica/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}