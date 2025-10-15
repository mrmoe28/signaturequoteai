/**
 * Debug endpoint to test Square OAuth flow
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    squareConfig: {
      applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?
        `${process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID.substring(0, 10)}...` : 'NOT SET',
      clientSecret: process.env.SQUARE_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET',
      environment: process.env.SQUARE_ENVIRONMENT || 'NOT SET',
    },
    stackAuthConfig: {
      projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID ? 'SET' : 'NOT SET',
      publishableKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ? 'SET' : 'NOT SET',
      serverKey: process.env.STACK_SECRET_SERVER_KEY ? 'SET' : 'NOT SET',
    },
    urls: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      expectedCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://signaturequoteai-main.vercel.app'}/api/integrations/square/callback`,
    },
    database: {
      url: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
    },
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
