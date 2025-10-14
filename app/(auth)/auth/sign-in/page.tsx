"use client";

import { SignIn } from "@stackframe/stack";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        <SignIn
          oauthProviders={[]}
        />
      </div>
    </div>
  );
}
