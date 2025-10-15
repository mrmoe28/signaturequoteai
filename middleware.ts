import { stackServerApp } from "./stack/server";
import { NextRequest, NextResponse } from 'next/server';
import { db } from './lib/db';
import { users } from './lib/db/schema';
import { eq } from 'drizzle-orm';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/forgot-password',
    '/auth/error',
    '/handler/sign-in',
    '/handler/sign-up',
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/api/auth') || pathname.startsWith('/handler')
  );

  // Allow access to API routes and public routes
  if (pathname.startsWith('/api') || isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication using Stack Auth
  const user = await stackServerApp.getUser();

  // If not authenticated and trying to access protected route, redirect to sign-in
  if (!user && !isPublicRoute) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirectUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated, sync user to local database
  if (user) {
    try {
      // Check if user exists in local database
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      // If user doesn't exist, create them
      if (existingUser.length === 0) {
        await db.insert(users).values({
          id: user.id,
          email: user.primaryEmail || `${user.id}@stack-auth.temp`,
          name: user.displayName || null,
          emailVerified: user.primaryEmailVerified ? new Date() : null,
          firstName: user.clientMetadata?.firstName as string || null,
          lastName: user.clientMetadata?.lastName as string || null,
          role: 'user',
          isActive: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[Middleware] Created new user in database: ${user.id}`);
      }
    } catch (error) {
      console.error('[Middleware] Error syncing user to database:', error);
      // Continue anyway - don't block the request
    }
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (user && (pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
