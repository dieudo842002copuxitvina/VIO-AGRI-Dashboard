import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const authenticatedRoutes = ['/profile', '/b2b/post']
const adminRoute = '/admin'

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  destination: string
) {
  const redirectResponse = NextResponse.redirect(new URL(destination, request.url))

  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie)
  }

  return redirectResponse
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdminRoute = matchesRoute(pathname, adminRoute)
  const isProtectedRoute =
    isAdminRoute || authenticatedRoutes.some((route) => matchesRoute(pathname, route))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Proxy] Missing Supabase environment variables for auth protection.')

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        })

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        })

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        response.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error(`[Proxy] Failed to resolve user session: ${authError.message}`)
  }

  if (!user && isProtectedRoute) {
    return redirectWithCookies(request, response, '/login')
  }

  if (user && pathname === '/login') {
    return redirectWithCookies(request, response, '/profile')
  }

  if (user && isAdminRoute) {
    const { data: profile, error: roleError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError) {
      console.error(`[Proxy] Failed to fetch user role: ${roleError.message}`)
      return redirectWithCookies(request, response, '/')
    }

    if (profile?.role !== 'admin') {
      return redirectWithCookies(request, response, '/')
    }

    // Future RBAC expansion can branch here for finer-grained admin permissions.
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
