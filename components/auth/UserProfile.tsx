"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

/**
 * Example component showing how to use Stack Auth
 * Displays user information and provides sign out functionality
 */
export function UserProfile() {
  const { user, isAuthenticated, isLoading, signOut, email, displayName } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <p className="text-sm text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <p className="text-sm text-muted-foreground mb-4">Not signed in</p>
        <Button onClick={() => router.push('/auth/sign-in')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Signed in as:</p>
        <p className="text-lg font-semibold">{displayName || email}</p>
        {displayName && <p className="text-sm text-muted-foreground">{email}</p>}
      </div>

      <div className="flex gap-2">
        <Button onClick={() => signOut()} variant="outline">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
