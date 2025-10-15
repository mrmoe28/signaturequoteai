/**
 * Stripe Configuration Endpoint
 *
 * Provides public Stripe configuration info to the client
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.STRIPE_CLIENT_ID;

  const isConfigured = !!(
    clientId &&
    clientId !== 'your_stripe_client_id_here' &&
    process.env.STRIPE_CLIENT_SECRET &&
    process.env.STRIPE_CLIENT_SECRET !== 'your_stripe_client_secret_here'
  );

  return NextResponse.json({
    configured: isConfigured,
    clientId: isConfigured ? clientId : null,
  });
}
