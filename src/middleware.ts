import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Dev-only bypass for /admin to avoid auth redirects during local work
  const forceAdminDev = process.env.NODE_ENV === 'development'
  if (forceAdminDev && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  console.log('[middleware] path:', request.nextUrl.pathname)
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!auth/callback|_next/static|_next/image|favicon.ico).*)'],
}
