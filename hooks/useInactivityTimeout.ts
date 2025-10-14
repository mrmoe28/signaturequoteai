"use client";

import { useEffect, useRef, useState } from 'react';

export interface InactivityTimeoutOptions {
  /**
   * Timeout in milliseconds before logout
   * Default: 30 minutes (1800000ms)
   */
  timeout?: number;

  /**
   * Warning time in milliseconds before actual logout
   * Default: 2 minutes (120000ms)
   */
  warningTime?: number;

  /**
   * Callback when user should be logged out
   */
  onTimeout: () => void;

  /**
   * Callback when warning should be shown
   */
  onWarning?: () => void;

  /**
   * Events to track for activity
   */
  events?: string[];
}

/**
 * Hook to handle automatic logout after period of inactivity
 *
 * @example
 * ```tsx
 * const { timeRemaining, isWarning, resetTimer } = useInactivityTimeout({
 *   timeout: 30 * 60 * 1000, // 30 minutes
 *   warningTime: 2 * 60 * 1000, // 2 minutes warning
 *   onTimeout: () => signOut(),
 *   onWarning: () => setShowWarning(true)
 * });
 * ```
 */
export function useInactivityTimeout(options: InactivityTimeoutOptions) {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes default
    warningTime = 2 * 60 * 1000, // 2 minutes warning default
    onTimeout,
    onWarning,
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  } = options;

  const [timeRemaining, setTimeRemaining] = useState(timeout);
  const [isWarning, setIsWarning] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Store callbacks in refs to avoid re-running effect when they change
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);

  // Update refs when callbacks change
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
    onWarningRef.current = onWarning;
  }, [onTimeout, onWarning]);

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = () => {
    clearTimers();
    setIsWarning(false);
    setTimeRemaining(timeout);
    lastActivityRef.current = Date.now();

    // Set warning timeout
    if (onWarningRef.current && warningTime > 0) {
      warningRef.current = setTimeout(() => {
        setIsWarning(true);
        if (onWarningRef.current) {
          onWarningRef.current();
        }
      }, timeout - warningTime);
    }

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeout);

    // Update time remaining every second
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, timeout - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearTimers();
      }
    }, 1000);
  };

  useEffect(() => {
    // Initialize timer
    resetTimer();

    // Add event listeners
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      clearTimers();
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeout, warningTime]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    timeRemainingFormatted: formatTime(timeRemaining),
    isWarning,
    resetTimer
  };
}
