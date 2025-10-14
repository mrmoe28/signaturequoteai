"use client";

import { SignUp } from "@stackframe/stack";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started with Signature QuoteCrawler
          </p>
        </div>
        <SignUp
          oauthProviders={[]}
        />
      </div>
    </div>
  );
}
