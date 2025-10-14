"use client";

import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  urls: {
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    handler: "/handler",
  },
});
