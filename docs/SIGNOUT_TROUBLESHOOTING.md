# Sign Out Troubleshooting Guide

## Common Sign Out Issues and Solutions

### Issue 1: Sign Out Button Not Working
**Symptoms:**
- Clicking sign out button does nothing
- No error messages in console
- User remains signed in

**Possible Causes:**
1. JavaScript errors preventing event handler execution
2. NextAuth configuration issues
3. Session management problems
4. Middleware conflicts

**Solutions:**

#### 1. Check Browser Console
Open browser developer tools and look for JavaScript errors when clicking sign out.

#### 2. Verify NextAuth Configuration
Ensure the auth configuration is correct:

```typescript
// lib/auth.ts
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut, // This should be exported
} = NextAuth({
  // ... configuration
})
```

#### 3. Test Sign Out Function
Create a test page to isolate the issue:

```tsx
'use client';
import { signOut } from 'next-auth/react';

export default function TestSignOut() {
  const handleSignOut = async () => {
    try {
      console.log('Attempting to sign out...');
      await signOut({ callbackUrl: '/' });
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <button onClick={handleSignOut}>
      Test Sign Out
    </button>
  );
}
```

### Issue 2: Sign Out Redirects to Wrong URL
**Symptoms:**
- Sign out works but redirects to incorrect page
- Blank page after sign out
- Infinite redirect loop

**Solutions:**

#### 1. Check Callback URL
Ensure the callback URL is correct:

```tsx
signOut({ callbackUrl: '/' }); // Redirects to home page
signOut({ callbackUrl: '/auth/login' }); // Redirects to login page
```

#### 2. Verify Environment Variables
Check that `NEXTAUTH_URL` is set correctly:

```bash
# .env.local
NEXTAUTH_URL="http://localhost:3000"  # For development
NEXTAUTH_URL="https://yourdomain.com" # For production
```

#### 3. Check Middleware Configuration
Ensure middleware allows the redirect:

```typescript
// middleware.ts
if (
  pathname.startsWith('/auth/') ||
  pathname === '/' ||
  // ... other allowed paths
) {
  return; // Allow redirect
}
```

### Issue 3: Session Not Clearing
**Symptoms:**
- User appears signed out but session persists
- Page refresh shows user still signed in
- Database session not deleted

**Solutions:**

#### 1. Check Session Strategy
Ensure database sessions are properly configured:

```typescript
// lib/auth.ts
export default NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'database', // Use database sessions
  },
  // ...
})
```

#### 2. Verify Database Connection
Check that the database adapter is working:

```typescript
// Test database connection
import { db } from './lib/db';
import { sessions } from './lib/db/schema';

// Check if sessions table exists and is accessible
const sessionCount = await db.select().from(sessions);
console.log('Sessions in database:', sessionCount.length);
```

#### 3. Check Session Cleanup
Ensure sessions are properly deleted on sign out:

```typescript
// This should happen automatically with DrizzleAdapter
// But you can verify by checking the database after sign out
```

### Issue 4: Google OAuth Sign Out Issues
**Symptoms:**
- Google sign out doesn't work
- User remains signed in to Google
- OAuth token not cleared

**Solutions:**

#### 1. Use Google Sign Out
For Google OAuth, you might need to sign out from Google as well:

```tsx
const handleGoogleSignOut = async () => {
  // Sign out from NextAuth
  await signOut({ callbackUrl: '/' });
  
  // Also sign out from Google
  window.location.href = 'https://accounts.google.com/logout';
};
```

#### 2. Check OAuth Configuration
Ensure Google OAuth is properly configured:

```typescript
// lib/auth.ts
Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
})
```

### Issue 5: Middleware Blocking Sign Out
**Symptoms:**
- Sign out request blocked by middleware
- 401/403 errors during sign out
- Middleware redirects during sign out

**Solutions:**

#### 1. Allow Auth API Routes
Ensure middleware allows NextAuth API routes:

```typescript
// middleware.ts
if (
  pathname.startsWith('/api/auth/') ||
  // ... other allowed paths
) {
  return; // Allow auth API calls
}
```

#### 2. Check Middleware Order
Ensure middleware doesn't interfere with auth:

```typescript
// middleware.ts
export default auth((req) => {
  // Only run middleware logic for protected routes
  // Auth API routes should be allowed through
})
```

## Debugging Steps

### 1. Enable Debug Logging
Add debug logging to see what's happening:

```typescript
// lib/auth.ts
export default NextAuth({
  debug: process.env.NODE_ENV === 'development',
  // ... rest of config
})
```

### 2. Check Network Tab
Open browser developer tools → Network tab and watch for:
- Sign out API calls to `/api/auth/signout`
- Response status codes
- Any failed requests

### 3. Test in Isolation
Create a minimal test page to isolate the sign out functionality:

```tsx
// app/test-signout/page.tsx
'use client';
import { useSession, signOut } from 'next-auth/react';

export default function TestSignOut() {
  const { data: session } = useSession();
  
  if (!session) return <div>Not signed in</div>;
  
  return (
    <div>
      <p>Signed in as: {session.user?.email}</p>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
}
```

### 4. Check Server Logs
Look at the server console for any errors during sign out:

```bash
npm run dev
# Watch for errors when clicking sign out
```

## Quick Fixes

### Fix 1: Clear Browser Data
Sometimes cached data causes issues:
1. Clear browser cookies
2. Clear local storage
3. Hard refresh (Ctrl+Shift+R)

### Fix 2: Restart Development Server
```bash
# Kill all Next.js processes
pkill -f "next dev"

# Restart
npm run dev
```

### Fix 3: Check Environment Variables
```bash
# Test environment variables
curl http://localhost:3000/api/test-env
```

### Fix 4: Verify Database
```bash
# Check if database is accessible
npm run db:studio
# Or check database connection in your app
```

## Prevention

1. **Always test sign out functionality** after making auth changes
2. **Use proper error handling** in sign out functions
3. **Test with different browsers** and incognito mode
4. **Verify environment variables** are set correctly
5. **Check middleware configuration** doesn't block auth routes

## Still Having Issues?

If none of these solutions work:

1. Check the NextAuth.js documentation: https://next-auth.js.org/
2. Look at the GitHub issues: https://github.com/nextauthjs/next-auth/issues
3. Create a minimal reproduction case
4. Check browser console for specific error messages
5. Verify all environment variables are set correctly
