import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccess, canAccessModule } from '@/lib/permissions'
import { UserRole } from '@/types'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isAuthRoute = pathname.startsWith('/login')
  const isPublicRoute = pathname === '/' || pathname.startsWith('/suspendida') || pathname.startsWith('/sin-empresa')
  const isApiRoute = pathname.startsWith('/api')

  if (isPublicRoute || isApiRoute) return supabaseResponse

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user && pathname.startsWith('/dashboard')) {
    let role: UserRole = 'vendedor'
    let modules: string[] = ['core']
    let is_superadmin = false

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_superadmin, companies(modules, active)')
        .eq('id', user.id)
        .single()

      if (profile?.role) role = profile.role as UserRole
      if (profile?.is_superadmin) is_superadmin = true

      const company = (profile?.companies as any)

      // Si empresa inactiva → suspendida
      if (!is_superadmin && company && !company.active) {
        return NextResponse.redirect(new URL('/suspendida', request.url))
      }

      if (company?.modules) modules = company.modules

    } catch {
      role = 'vendedor'
    }

    // Superadmin puede ir a cualquier ruta
    if (is_superadmin) return supabaseResponse

    // Verificar rol
    const allowed = canAccess(role, pathname)
    if (!allowed) {
      const url = new URL('/dashboard', request.url)
      url.searchParams.set('denied', '1')
      return NextResponse.redirect(url)
    }

    // Verificar módulo
    const moduleAllowed = canAccessModule(modules, pathname)
    if (!moduleAllowed) {
      const url = new URL('/dashboard', request.url)
      url.searchParams.set('modulo', '1')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}