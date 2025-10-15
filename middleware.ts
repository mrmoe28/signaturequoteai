import { NextRequest, NextResponse } from 'next/server';
import { getUser } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/forgot-password',
    '/auth/error',
    '/payment-error',
  ];

  const isPublicRoute = publicRoutes.includes(pathname);

  // Check authentication
  const user = await getUser();

  console.log(`[Middleware] Path: ${pathname}, User: ${user ? user.id : 'null'}`);

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (user && (pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up'))) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If not authenticated and trying to access protected route, redirect to sign-in
  if (!user && !isPublicRoute) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirectUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
