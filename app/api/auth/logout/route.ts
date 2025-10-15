import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-logout');

export async function POST(request: NextRequest) {
  try {
    await deleteSession();

    logger.info('User logged out successfully');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Logout error');
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
