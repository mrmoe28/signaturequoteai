import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, createSession } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const logger = createLogger('auth-login');

function getClientIp(request: NextRequest): string {
  // Try to get IP from various headers (in order of preference)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get client IP address
    const clientIp = getClientIp(request);

    // Verify credentials
    const user = await verifyCredentials(email, password);

    if (!user) {
      logger.warn({ email }, 'Failed login attempt');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login IP
    if (clientIp !== 'unknown') {
      await db
        .update(users)
        .set({ lastLoginIp: clientIp })
        .where(eq(users.id, user.id));
    }

    // Create session
    await createSession(user.id);

    logger.info({ userId: user.id, email: user.email, ip: clientIp }, 'User logged in successfully');

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Login error');
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
