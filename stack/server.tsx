import "server-only";

import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
  },
});
