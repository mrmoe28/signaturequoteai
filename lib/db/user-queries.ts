import { db } from './index';
import { users, sessions } from './schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateSessionToken, createSessionExpiry } from '../auth-utils';

export type CreateUserData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'user';
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SessionData = {
  sessionToken: string;
  userId: string;
  expires: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: string;
  };
};

export async function createUser(userData: CreateUserData) {
  const passwordHash = await hashPassword(userData.password);
  
  const [user] = await db.insert(users).values({
    email: userData.email.toLowerCase(),
    passwordHash,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role || 'user',
  }).returning({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    role: users.role,
  });
  
  return user;
}

export async function authenticateUser(credentials: LoginCredentials): Promise<SessionData | null> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(and(
      eq(users.email, credentials.email.toLowerCase()),
      eq(users.isActive, 'true')
    ))
    .limit(1);
  
  if (!user) {
    return null;
  }

  // Check if user has a password (OAuth users don't)
  if (!user.passwordHash) {
    return null;
  }

  // Verify password
  const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }
  
  // Create session
  const sessionToken = generateSessionToken();
  const expires = createSessionExpiry(24); // 24 hours

  const [session] = await db.insert(sessions).values({
    userId: user.id,
    sessionToken,
    expires,
  }).returning();
  
  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  
  return {
    sessionToken: session.sessionToken,
    userId: user.id,
    expires: session.expires,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      isActive: user.isActive,
    },
  };
}

export async function validateSession(token: string): Promise<SessionData | null> {
  const [result] = await db
    .select({
      sessionToken: sessions.sessionToken,
      userId: sessions.userId,
      expires: sessions.expires,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(
      eq(sessions.sessionToken, token),
      eq(users.isActive, 'true')
    ))
    .limit(1);

  if (!result) {
    return null;
  }

  // Check if session is expired
  if (new Date() > result.expires) {
    // Clean up expired session
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
    return null;
  }

  return {
    sessionToken: result.sessionToken,
    userId: result.userId,
    expires: result.expires,
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName || '',
      lastName: result.user.lastName || '',
      role: result.user.role,
      isActive: result.user.isActive,
    },
  };
}

export async function invalidateSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, token));
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  
  return user || null;
}

export async function listUsers() {
  return db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      emailVerified: users.emailVerified,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);
}