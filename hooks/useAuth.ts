"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth";

/**
 * Custom hook for accessing authentication functionality
 * Uses custom bcrypt authentication system
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    // Fetch current user from API
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/sign-in');
    }
  };

  return {
    // User object (null if not authenticated, undefined if loading)
    user,

    // Boolean flags
    isAuthenticated: !!user,
    isLoading: user === undefined,

    // Auth methods
    signOut,

    // User properties (with null checks)
    email: user?.email || null,
    displayName: user?.name || null,
    userId: user?.id || null,
  };
}
