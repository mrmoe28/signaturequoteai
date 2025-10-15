/**
 * Debug endpoint to check if user exists in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get Stack Auth user
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json({
        error: 'Not authenticated with Stack Auth',
        stackUser: null,
        dbUser: null,
      });
    }

    // Check if user exists in database
    const dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, stackUser.id))
      .limit(1);

    const dbUser = dbUsers[0] || null;

    return NextResponse.json({
      stackUser: {
        id: stackUser.id,
        email: stackUser.primaryEmail,
        displayName: stackUser.displayName,
      },
      dbUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        squareConnected: !!dbUser.squareMerchantId,
        stripeConnected: !!dbUser.stripeAccountId,
      } : null,
      exists: !!dbUser,
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      stackUser: null,
      dbUser: null,
    }, { status: 500 });
  }
}
