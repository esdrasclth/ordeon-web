import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccess } from '@/lib/permissions'
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

  const isAuthRoute   = pathname.startsWith('/login')
  const isPublicRoute = pathname === '/'
  const isApiRoute    = pathname.startsWith('/api')

  if (isPublicRoute || isApiRoute) return supabaseResponse

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user && pathname.startsWith('/dashboard')) {
    // Leer el rol desde los metadatos de la sesión primero
    // y como fallback consultar profiles
    let role: UserRole = 'vendedor'

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        role = profile.role as UserRole
      }
    } catch {
      // Si falla la consulta, denegar acceso a rutas protegidas
      role = 'vendedor'
    }

    const allowed = canAccess(role, pathname)

    if (!allowed) {
      const url = new URL('/dashboard', request.url)
      url.searchParams.set('denied', '1')
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