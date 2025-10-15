/**
 * Square Configuration Endpoint
 *
 * Provides public Square configuration info to the client
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

  const isConfigured = !!(
    applicationId &&
    applicationId !== 'your_square_app_id_here' &&
    process.env.SQUARE_CLIENT_SECRET &&
    process.env.SQUARE_CLIENT_SECRET !== 'your_square_client_secret_here'
  );

  return NextResponse.json({
    configured: isConfigured,
    applicationId: isConfigured ? applicationId : null,
    environment,
  });
}
