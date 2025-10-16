'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * SessionGuard component that enforces session-only authentication
 * Logs out users when they close the browser (new browser session)
 *
 * Logic:
 * - sessionStorage: Cleared when browser closes (all tabs)
 * - localStorage: Persists across browser sessions
 *
 * We use both to distinguish:
 * A. Fresh sign-in (no flags at all → stay logged in, set flags)
 * B. New browser session after closing (localStorage exists but sessionStorage cleared → log out)
 */
export function SessionGuard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isLoggingOut = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent running multiple times
    if (hasInitialized.current) return;

    if (!user) {
      // User not logged in, clear any leftover flags
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('session-active');
        localStorage.removeItem('has-session');
      }
      return;
    }

    // User is logged in, check session
    const sessionKey = 'session-active';
    const persistentKey = 'has-session';

    const hasSessionStorage = sessionStorage.getItem(sessionKey);
    const hasLocalStorage = localStorage.getItem(persistentKey);

    if (!hasSessionStorage && hasLocalStorage) {
      // Case B: Had a previous session (localStorage exists) but sessionStorage cleared
      // This means browser was closed → new browser session → log out
      if (!isLoggingOut.current) {
        isLoggingOut.current = true;
        console.log('New browser session detected (browser was closed), logging out...');

        // Clear flags before signing out
        localStorage.removeItem(persistentKey);
        sessionStorage.removeItem(sessionKey);

        signOut();
      }
    } else {
      // Case A: Fresh sign-in OR continuing existing session
      // Only set flags if they don't already exist
      if (!hasSessionStorage) {
        sessionStorage.setItem(sessionKey, 'true');
      }
      if (!hasLocalStorage) {
        localStorage.setItem(persistentKey, 'true');
      }
      hasInitialized.current = true;
    }
  }, [user, signOut, router]);

  return null;
}
