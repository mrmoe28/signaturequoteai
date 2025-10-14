import NextAuth, { type AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, getDb } from './db';
import { users, accounts, sessions, verificationTokens } from './db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user by email
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || user.length === 0) {
          throw new Error('Invalid email or password');
        }

        const dbUser = user[0];

        // Check if user has a password (OAuth users don't)
        if (!dbUser.passwordHash) {
          throw new Error('Please sign in with Google');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          dbUser.passwordHash
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Check if user is active
        if (dbUser.isActive !== 'true') {
          throw new Error('Account is not active');
        }

        // Return user object
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: `${dbUser.firstName} ${dbUser.lastName}`,
          role: dbUser.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
export { authOptions };
