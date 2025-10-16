/**
 * Debug endpoint to check if user exists in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getUser();

    if (!authUser) {
      return NextResponse.json({
        error: 'Not authenticated',
        user: null,
        dbUser: null,
      });
    }

    // Check if user exists in database
    const dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    const dbUser = dbUsers[0] || null;

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
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
      user: null,
      dbUser: null,
    }, { status: 500 });
  }
}
