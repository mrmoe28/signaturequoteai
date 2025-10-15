/**
 * Simple Authentication Utilities
 *
 * Provides functions for password hashing, session management,
 * and user authentication without external auth providers.
 */

import { cookies } from 'next/headers';
import { db } from './db';
import { users, sessions } from './db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string> {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires,
    createdAt: new Date(),
  });

  // Set the session cookie
  (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });

  return sessionToken;
}

/**
 * Get the current authenticated user from session
 */
export async function getUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    // Get session from database
    const sessionData = await db
      .select({
        userId: sessions.userId,
        expires: sessions.expires,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.sessionToken, sessionToken),
          gt(sessions.expires, new Date())
        )
      )
      .limit(1);

    if (sessionData.length === 0) {
      // Session expired or invalid
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Get user data
    const userData = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, sessionData[0].userId))
      .limit(1);

    if (userData.length === 0 || userData[0].isActive !== 'true') {
      return null;
    }

    // Update last login time
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userData[0].id));

    return {
      id: userData[0].id,
      email: userData[0].email,
      name: userData[0].name,
      firstName: userData[0].firstName,
      lastName: userData[0].lastName,
      role: userData[0].role,
      isActive: userData[0].isActive,
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    // Delete session from database
    await db
      .delete(sessions)
      .where(eq(sessions.sessionToken, sessionToken));

    // Delete session cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db
    .delete(sessions)
    .where(gt(new Date(), sessions.expires));
}

/**
 * Verify user credentials and return user if valid
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  try {
    // Get user by email
    const userData = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userData.length === 0) {
      return null;
    }

    const user = userData[0];

    // Check if user is active
    if (user.isActive !== 'true') {
      return null;
    }

    // Check if password hash exists
    if (!user.passwordHash) {
      return null;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Return user without password hash
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return null;
  }
}

/**
 * Create a new user account
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ user: AuthUser; sessionToken: string } | { error: string }> {
  try {
    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return { error: 'An account with this email already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: data.email.toLowerCase(),
        name: data.name || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        passwordHash,
        role: 'user',
        isActive: 'true',
        emailVerified: new Date(), // Auto-verify for now
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
      });

    if (newUser.length === 0) {
      return { error: 'Failed to create user account' };
    }

    // Create session
    const sessionToken = await createSession(newUser[0].id);

    return {
      user: newUser[0],
      sessionToken,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error: 'Failed to create account. Please try again.' };
  }
}
