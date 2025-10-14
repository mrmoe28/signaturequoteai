'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

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
  const user = useUser();
  const router = useRouter();
  const isLoggingOut = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent running multiple times
    if (hasInitialized.current) return;

    if (!user) {
      // User not logged in, clear any leftover flags
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('stack-session-active');
        localStorage.removeItem('stack-has-session');
      }
      return;
    }

    // User is logged in, check session
    const sessionKey = 'stack-session-active';
    const persistentKey = 'stack-has-session';

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

        user.signOut().then(() => {
          router.push('/auth/sign-in');
        }).catch((error) => {
          console.error('Error signing out:', error);
          router.push('/auth/sign-in');
        });
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
  }, [user, router]);

  return null;
}
