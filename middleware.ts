import { auth } from '@/lib/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Allow auth pages and API routes
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/' ||
    pathname.startsWith('/api/webhook') ||
    pathname === '/api/test-env' ||
    pathname === '/api/test-email' ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') // Static files
  ) {
    return
  }

  // Protect all other routes
  if (!req.auth) {
    const url = new URL('/auth/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return Response.redirect(url)
  }
})

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}