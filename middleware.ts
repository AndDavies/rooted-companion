import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next()
    
    // Initialize Supabase client for middleware
    const supabase = await createClient()
    
    // Refresh the session; getUser() validates the token on the server
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Define protected routes
    const protectedRoutes = ['/dashboard']
    const authRoutes = ['/login', '/signup']
    
    const isProtectedRoute = protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )
    
    const isAuthRoute = authRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )
    
    // If accessing a protected route without authentication, redirect to login
    if (isProtectedRoute && (!user || error)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // If accessing auth routes while authenticated, redirect to dashboard
    if (isAuthRoute && user && !error) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return response
    
  } catch (e) {
    // On error, allow request to continue
    console.error('Middleware error:', e)
    return NextResponse.next()
  }
}

// Configure which routes run through this middleware
export const config = {
  matcher: [
    // Match all request paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}