'use client';

import { useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

/**
 * SessionGuard component that enforces session-only authentication
 * Logs out users when they close the browser (new browser session)
 */
export function SessionGuard() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Check if this is a new browser session
    const sessionKey = 'stack-session-active';
    const wasSessionActive = sessionStorage.getItem(sessionKey);

    if (!wasSessionActive) {
      // New browser session detected - log out
      console.log('New browser session detected, logging out...');
      user.signOut().then(() => {
        sessionStorage.removeItem(sessionKey);
        router.push('/auth/sign-in');
      }).catch((error) => {
        console.error('Error signing out:', error);
        router.push('/auth/sign-in');
      });
    } else {
      // Existing session - mark as active
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [user, router]);

  // Set session as active on sign-in
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('stack-session-active', 'true');
    }
  }, [user]);

  return null;
}
