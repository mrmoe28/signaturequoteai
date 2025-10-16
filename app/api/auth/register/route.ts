import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { db } from '@/lib/db';
import { users, quotes } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

const logger = createLogger('auth-register');

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
    const { email, password, name, firstName, lastName } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get client IP address
    const clientIp = getClientIp(request);
    logger.info({ ip: clientIp }, 'Registration attempt from IP');

    // Check if this IP already has blocked free accounts
    if (clientIp !== 'unknown') {
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.registrationIp, clientIp));

      if (existingUsers.length > 0) {
        // Check if any of these users have reached their quote limit
        for (const user of existingUsers) {
          const userQuotes = await db
            .select({ count: count() })
            .from(quotes)
            .where(eq(quotes.id, user.id));

          const quoteCount = userQuotes[0]?.count || 0;
          if (quoteCount >= 5) {
            logger.warn({ ip: clientIp }, 'Registration blocked: IP has existing account with 5+ quotes');
            return NextResponse.json(
              {
                error: 'A free account from this device has reached its quota. Please upgrade your existing account or contact support.',
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // Create user with IP address
    const result = await createUser({
      email,
      password,
      name,
      firstName,
      lastName,
      registrationIp: clientIp,
    });

    if ('error' in result) {
      logger.warn({ email }, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    logger.info({ userId: result.user.id, email: result.user.email }, 'User registered successfully');

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Registration error');
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
