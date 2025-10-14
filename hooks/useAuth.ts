"use client";

import { useStackApp, useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

/**
 * Custom hook for accessing Stack Auth functionality
 * Provides easy access to current user, auth status, and auth methods
 */
export function useAuth() {
  const app = useStackApp();
  const user = useUser();
  const router = useRouter();

  const signOut = async () => {
    await user?.signOut();
    router.push('/auth/sign-in');
  };

  return {
    // User object (null if not authenticated)
    user,

    // Boolean flags
    isAuthenticated: !!user,
    isLoading: user === undefined,

    // Auth methods
    signOut,

    // User properties (with null checks)
    email: user?.primaryEmail || null,
    displayName: user?.displayName || null,
    userId: user?.id || null,
  };
}
