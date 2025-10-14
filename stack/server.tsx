import "server-only";

import { StackServerApp } from "@stackframe/stack";

// Get the base URL from environment variable, fallback to localhost for development
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                'http://localhost:3000';

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: `${baseUrl}/dashboard`,
    afterSignUp: `${baseUrl}/dashboard`,
    signIn: `${baseUrl}/handler/sign-in`,
    signUp: `${baseUrl}/handler/sign-up`,
  },
});
