import NextAuth, { type DefaultSession } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db'
import { users, accounts, sessions, verificationTokens } from './db'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      stripeCustomerId?: string
      subscriptionStatus?: string
      quotesUsed: number
      quotesLimit: number
    } & DefaultSession['user']
  }

  interface User {
    role: string
    stripeCustomerId?: string
    subscriptionStatus?: string
    quotesUsed: number
    quotesLimit: number
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
            .then(rows => rows[0])

          if (!user || !user.password) {
            return null
          }

          const passwordsMatch = await bcrypt.compare(password, user.password)
          
          if (!passwordsMatch) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            stripeCustomerId: user.stripeCustomerId,
            subscriptionStatus: user.subscriptionStatus,
            quotesUsed: Number(user.quotesUsed),
            quotesLimit: Number(user.quotesLimit),
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user) {
        session.user.id = user.id
        session.user.role = user.role as string
        session.user.stripeCustomerId = user.stripeCustomerId as string
        session.user.subscriptionStatus = user.subscriptionStatus as string
        session.user.quotesUsed = Number(user.quotesUsed)
        session.user.quotesLimit = Number(user.quotesLimit)
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email!))
            .limit(1)
            .then(rows => rows[0])

          if (!existingUser) {
            // Create new user from Google profile
            await db.insert(users).values({
              email: user.email!,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
              role: 'user',
              quotesUsed: 0,
              quotesLimit: 3,
            })
          }
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }
      return true
    },
  },
})

// Helper functions for auth
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(role: string) {
  const user = await requireAuth()
  if (user.role !== role) {
    throw new Error('Forbidden')
  }
  return user
}

// Paywall helpers
export async function checkQuoteLimit(userId: string): Promise<{ canCreate: boolean; quotesUsed: number; quotesLimit: number }> {
  const user = await db
    .select({
      quotesUsed: users.quotesUsed,
      quotesLimit: users.quotesLimit,
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0])

  if (!user) {
    throw new Error('User not found')
  }

  const quotesUsed = Number(user.quotesUsed)
  const quotesLimit = Number(user.quotesLimit)
  const isSubscribed = user.subscriptionStatus === 'active'

  // Unlimited quotes for subscribers
  if (isSubscribed) {
    return { canCreate: true, quotesUsed, quotesLimit: -1 }
  }

  // Check free tier limit
  const canCreate = quotesUsed < quotesLimit

  return { canCreate, quotesUsed, quotesLimit }
}

export async function incrementQuoteUsage(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      quotesUsed: db
        .select({ count: users.quotesUsed })
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => Number(rows[0]?.count || 0) + 1),
    })
    .where(eq(users.id, userId))
}