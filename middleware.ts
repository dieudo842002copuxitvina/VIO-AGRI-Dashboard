import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/features',
  '/api/auth',
]

// Routes that require authentication
const protectedRoutes = [
  '/profile',
  '/b2b',
  '/b2b/post',
  '/b2b/deal',
  '/shop',
  '/dashboard',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('sb-access-token')?.value

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))

  // Allow access to public routes without authentication
  if (isPublicRoute && !isProtectedRoute) {
    // If authenticated user tries to access /login or /register, redirect to profile
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/profile', req.url))
    }
    return NextResponse.next()
  }

  // MVP: Bypass auth check for /admin route during testing
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Protect routes that require authentication
  if (!token) {
    // Redirect unauthenticated users to login (but not if already on login)
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}