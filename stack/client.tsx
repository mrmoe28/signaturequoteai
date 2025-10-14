"use client";

import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
  },
});
