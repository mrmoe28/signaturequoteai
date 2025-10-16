"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InactivityLogoutProps {
  /**
   * Inactivity timeout in minutes
   * @default 30
   */
  timeoutMinutes?: number;

  /**
   * Warning time in minutes before logout
   * @default 2
   */
  warningMinutes?: number;
}

/**
 * Component that handles automatic logout after inactivity
 * Add this to your root layout to enable auto-logout across the app
 */
export function InactivityLogout({
  timeoutMinutes = 30,
  warningMinutes = 2,
}: InactivityLogoutProps) {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const { timeRemainingFormatted, isWarning, resetTimer } = useInactivityTimeout({
    timeout: timeoutMinutes * 60 * 1000,
    warningTime: warningMinutes * 60 * 1000,
    onTimeout: handleLogout,
    onWarning: () => setShowWarning(true),
  });

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    handleLogout();
  };

  // Only show for logged-in users
  if (!user) {
    return null;
  }

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ve been inactive for a while. For your security, you&apos;ll be automatically logged out in{' '}
            <span className="font-semibold text-foreground">{timeRemainingFormatted}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogoutNow}>
            Logout Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
