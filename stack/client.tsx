"use client";

import { StackClientApp } from "@stackframe/stack";

// Get the base URL - in client components, we can use window.location or env variable
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ||
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
};

const baseUrl = getBaseUrl();

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: `${baseUrl}/dashboard`,
    afterSignUp: `${baseUrl}/dashboard`,
    signIn: `${baseUrl}/handler/sign-in`,
    signUp: `${baseUrl}/handler/sign-up`,
  },
});
