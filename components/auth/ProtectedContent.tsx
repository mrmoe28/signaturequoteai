"use client";

import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedContentProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Wrapper component that protects content from unauthenticated users
 * Redirects to sign-in if user is not authenticated
 */
export function ProtectedContent({
  children,
  fallback,
  redirectTo = "/auth/sign-in"
}: ProtectedContentProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
