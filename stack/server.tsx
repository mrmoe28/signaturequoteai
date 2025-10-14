import "server-only";

import { StackServerApp } from "@stackframe/stack";

// Get the base URL from environment variable, fallback to localhost for development
// NEXT_PUBLIC_APP_URL should be set to https://signaturequoteai-main.vercel.app in production
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  urls: {
    afterSignIn: `${baseUrl}/dashboard`,
    afterSignUp: `${baseUrl}/dashboard`,
    signIn: `${baseUrl}/handler/sign-in`,
    signUp: `${baseUrl}/handler/sign-up`,
  },
});
