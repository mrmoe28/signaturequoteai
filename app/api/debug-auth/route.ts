import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check all auth-related environment variables
    const authVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    // Check if variables are properly formatted
    const validation = {
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nextAuthUrlValid: process.env.NEXTAUTH_URL?.startsWith('https://'),
      clientIdFormat: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com'),
      clientSecretFormat: process.env.GOOGLE_CLIENT_SECRET?.startsWith('GOCSPX-'),
    };

    // Test NextAuth configuration
    let nextAuthError = null;
    try {
      // Try to import NextAuth config
      const { auth } = await import('@/lib/auth');
      // This will throw if there's a configuration error
      await auth();
    } catch (error) {
      nextAuthError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      environment: authVars,
      validation,
      nextAuthError,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to debug auth configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
