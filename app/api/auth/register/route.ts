import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-register');

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

    // Create user
    const result = await createUser({
      email,
      password,
      name,
      firstName,
      lastName,
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
