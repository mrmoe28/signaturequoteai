# Stack Auth Setup Guide

This project uses **Stack Auth** for authentication. Stack Auth provides a complete authentication solution with pre-built UI components, session management, and security features.

## ✅ What's Already Configured

The following Stack Auth setup is already complete:

### 1. Environment Variables (`.env.local`)
```bash
NEXT_PUBLIC_STACK_PROJECT_ID=7483f4ef-e940-4438-9ddc-3114978a2b90
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_hpc8dwr6k08qsgm2b9rdmnfvjvab094xhzbc6kzmxx6j8
STACK_SECRET_SERVER_KEY=ssk_xmpfs5s9438bhvqwgxsj9pk53kw0d53b3tr3z4g7q836g
```

### 2. Stack Configuration Files

**Client Configuration** (`stack/client.tsx`):
- Configured for client-side authentication
- Uses Next.js cookie-based token storage

**Server Configuration** (`stack/server.tsx`):
- Configured for server-side authentication
- Includes server-only directive for security

### 3. Provider Setup

The `StackProvider` is already set up in the root layout (`app/layout.tsx`):
```tsx
<StackProvider app={stackClientApp}>
  <StackTheme>
    {children}
  </StackTheme>
</StackProvider>
```

### 4. Authentication Pages

Pre-built authentication pages are available at:
- `/auth/sign-in` - Sign in page with email/password
- `/auth/sign-up` - Registration page
- `/auth/forgot-password` - Password reset page

### 5. Protected Routes

Middleware is configured in `middleware.ts` to:
- Protect dashboard and other private routes
- Redirect unauthenticated users to sign-in
- Redirect authenticated users away from auth pages

### 6. API Handler

Stack Auth API routes are configured at:
```
/api/auth/stack/[...stack]
```

This handles all Stack Auth API requests (GET, POST, PUT, DELETE).

## 📚 How to Use Stack Auth

### Using the Custom `useAuth` Hook

The `useAuth` hook provides easy access to authentication state:

```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";

export function MyComponent() {
  const {
    user,           // Current user object (null if not authenticated)
    isAuthenticated, // Boolean: true if user is signed in
    isLoading,      // Boolean: true while checking auth state
    signOut,        // Function to sign out user
    email,          // User's email
    displayName,    // User's display name
    userId          // User's ID
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {displayName || email}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Using Stack Auth Components

Stack Auth provides pre-built UI components:

```tsx
import { SignIn, SignUp, ForgotPassword } from "@stackframe/stack";

// Sign In Component
<SignIn />

// Sign Up Component
<SignUp />

// Forgot Password Component
<ForgotPassword />
```

### Protecting Content (Client-Side)

Use the `ProtectedContent` wrapper component:

```tsx
import { ProtectedContent } from "@/components/auth/ProtectedContent";

export default function MyPage() {
  return (
    <ProtectedContent fallback={<div>Loading...</div>}>
      <div>This content is only visible to authenticated users</div>
    </ProtectedContent>
  );
}
```

### Server-Side Authentication

For server components and API routes:

```tsx
import { stackServerApp } from "@/stack/server";

// In a Server Component
export default async function ServerPage() {
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <div>
      <h1>Welcome, {user.displayName}</h1>
      <p>Email: {user.primaryEmail}</p>
    </div>
  );
}
```

```tsx
// In an API Route
import { stackServerApp } from "@/stack/server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await stackServerApp.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    userId: user.id,
    email: user.primaryEmail
  });
}
```

### Using the Direct Stack Hooks

You can also use Stack Auth's built-in hooks directly:

```tsx
import { useUser, useStackApp } from "@stackframe/stack";

export function MyComponent() {
  const user = useUser();
  const app = useStackApp();

  const handleSignOut = async () => {
    await app.signOut();
  };

  return user ? (
    <div>
      <p>Hello, {user.displayName}</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  ) : (
    <div>Not signed in</div>
  );
}
```

## 🔐 Security Features

Stack Auth includes:

- ✅ Secure session management with HTTP-only cookies
- ✅ CSRF protection
- ✅ Password hashing and validation
- ✅ Email verification
- ✅ Password reset flows
- ✅ Rate limiting
- ✅ Automatic token refresh

## 🚀 Testing the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test sign-up:**
   - Navigate to `http://localhost:3000/auth/sign-up`
   - Create a new account

3. **Test sign-in:**
   - Navigate to `http://localhost:3000/auth/sign-in`
   - Sign in with your credentials

4. **Test protected routes:**
   - Try accessing `/dashboard` without authentication
   - You should be redirected to sign-in

5. **Test sign-out:**
   - Use the sign-out button on any authenticated page

## 📖 Additional Resources

- [Stack Auth Documentation](https://docs.stack-auth.com/)
- [Stack Auth GitHub](https://github.com/stackframe-community/stack)
- [Next.js App Router Guide](https://nextjs.org/docs/app)

## 🛠️ Troubleshooting

### Issue: "Invalid credentials" error
- Check that environment variables are set correctly
- Verify the Stack Auth project is active in your dashboard

### Issue: Redirect loop
- Clear browser cookies
- Check middleware configuration in `middleware.ts`

### Issue: User not persisting
- Verify `tokenStore: "nextjs-cookie"` is set in Stack config
- Check that cookies are enabled in your browser

## 📝 Next Steps

1. Customize the authentication UI to match your brand
2. Add user profile management
3. Implement role-based access control (RBAC)
4. Set up email templates in Stack dashboard
5. Configure OAuth providers (Google, GitHub, etc.)

---

**Stack Auth is now fully configured and ready to use!** 🎉
