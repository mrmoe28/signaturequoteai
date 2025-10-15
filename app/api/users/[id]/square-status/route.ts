import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-user-square-status');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    logger.info({ userId }, 'Fetching user Square connection status');

    // Get user's Square connection details
    const [user] = await db
      .select({
        squareMerchantId: users.squareMerchantId,
        squareLocationId: users.squareLocationId,
        squareEnvironment: users.squareEnvironment,
        squareConnectedAt: users.squareConnectedAt,
        squareAccessToken: users.squareAccessToken,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if Square is connected (has access token and merchant ID)
    const squareConnected = !!(user.squareAccessToken && user.squareMerchantId);

    logger.info(
      { userId, squareConnected },
      'User Square status fetched successfully'
    );

    return NextResponse.json({
      squareConnected,
      squareMerchantId: user.squareMerchantId,
      squareLocationId: user.squareLocationId,
      squareEnvironment: user.squareEnvironment,
      squareConnectedAt: user.squareConnectedAt?.toISOString(),
    });

  } catch (error) {
    const { id: userId } = await params;
    logger.error({ error, userId }, 'Failed to fetch user Square status');
    return NextResponse.json(
      { error: 'Failed to fetch Square status' },
      { status: 500 }
    );
  }
}
