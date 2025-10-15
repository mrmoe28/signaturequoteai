# Stack Auth + Square OAuth Integration Analysis

## User Question
> "Could the connecting to square problem be coming from Auth Stack?"

## Investigation Summary

### Current Setup

**Stack Auth Configuration** (`middleware.ts`):
- Stack Auth middleware runs on ALL routes (except static assets)
- Authenticates users via `stackServerApp.getUser()`
- Allows API routes to pass through without auth check (line 23)

**Square OAuth Flow**:
1. User clicks "Connect Square" in Settings page
2. Redirects to Square OAuth: `https://connect.squareup.com/oauth2/authorize`
3. Square redirects back to: `/api/integrations/square/callback`
4. Callback exchanges code for access token
5. Saves tokens to database
6. Redirects to `/settings?success=square_connected`

### Potential Conflicts

#### ✅ API Route Protection - NO ISSUE
```typescript
// middleware.ts:23-25
if (pathname.startsWith('/api') || isPublicRoute) {
  return NextResponse.next();
}
```
**Analysis**: The callback route `/api/integrations/square/callback` starts with `/api`, so it bypasses Stack Auth middleware. ✅ No conflict here.

#### ⚠️ Cookie/Session Conflicts - POTENTIAL ISSUE

**Stack Auth Session Storage**:
- Uses `tokenStore: "nextjs-cookie"` (from `stack/client.tsx:6`)
- Stores session in HTTP cookies

**Square OAuth State Parameter**:
- Uses `state: userId` to track which user is connecting
- No session storage required during OAuth redirect

**Potential Issue**: If Stack Auth's session cookies have strict SameSite settings or secure flags, the redirect flow might not preserve session context properly.

#### ⚠️ Redirect Chain - POTENTIAL ISSUE

**Current Flow**:
1. User on `/settings` (authenticated via Stack Auth)
2. Click "Connect" → redirect to `https://connect.squareup.com`
3. Square redirects back to `/api/integrations/square/callback`
4. Callback redirects to `/settings?success=square_connected`
5. Stack Auth middleware checks authentication again

**Potential Issue**: The final redirect to `/settings` goes through middleware again. If Stack Auth session was somehow lost during Square OAuth flow, user would be redirected to sign-in.

#### ❌ Environment Variable Mismatch - KNOWN ISSUE (FIXED)

**Previously Fixed**:
- `SQUARE_ENVIRONMENT` had trailing newline: `"production\n"`
- Application ID mismatch between Vercel and Square dashboard
- Both issues have been resolved

### What's NOT a Conflict

1. **Middleware Matching**: API routes are explicitly excluded from auth checks
2. **OAuth Scopes**: Stack Auth uses its own scopes; Square uses separate scopes
3. **Token Storage**: Stack Auth tokens stored in cookies; Square tokens stored in database
4. **User Identity**: Both systems use separate user IDs (Stack Auth ID used as `state` parameter)

## Recommended Debugging Steps

### 1. Add Comprehensive Logging to Callback Route

Add logging to track the entire OAuth flow:

```typescript
// app/api/integrations/square/callback/route.ts
export async function GET(request: NextRequest) {
  console.log('🔵 Square OAuth Callback - START');
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  console.log('Cookies:', request.cookies.getAll());

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔵 OAuth params:', { code: code?.substring(0, 10), state, error });

    // ... rest of callback logic

    console.log('✅ Square OAuth Callback - SUCCESS');
  } catch (error) {
    console.error('❌ Square OAuth Callback - ERROR:', error);
    throw error;
  }
}
```

### 2. Check for Cookie/Session Issues

Verify Stack Auth cookies are preserved during OAuth flow:

```typescript
// In callback route, check if Stack Auth session exists
const stackAuthCookie = request.cookies.get('stack-auth-session'); // Check actual cookie name
console.log('Stack Auth session present:', !!stackAuthCookie);
```

### 3. Test Direct API Access

Test if callback endpoint works independently:

```bash
# Simulate Square OAuth callback with test parameters
curl "https://signaturequoteai-main.vercel.app/api/integrations/square/callback?code=test_code&state=test_user_id"
```

### 4. Monitor Network Tab

1. Open browser DevTools → Network tab
2. Click "Connect Square Account"
3. Watch for:
   - Initial redirect to Square
   - Callback request from Square
   - Final redirect to /settings
   - Any failed requests or redirects

### 5. Check Vercel Logs

```bash
vercel logs --follow
```

Then trigger Square OAuth flow and watch for:
- Callback route execution
- Any middleware errors
- Database update success/failure

## Most Likely Issue (Based on Previous Fixes)

Based on the conversation history, the previous issues were:
1. ✅ Wrong Application ID in Vercel (FIXED)
2. ✅ Environment variable had trailing newline (FIXED)
3. ✅ Hardcoded frontend not showing connection (FIXED)

**Current Status**: OAuth should be working. If it's still not working, most likely causes:

1. **Vercel Environment Variables Not Refreshed**
   - After updating environment variables, Vercel needs redeployment
   - Check with: `vercel env pull .env.local` and verify values

2. **Square Application Settings**
   - Verify redirect URI in Square dashboard matches exactly:
     - Production: `https://signaturequoteai-main.vercel.app/api/integrations/square/callback`
   - Must include protocol, domain, and full path

3. **Stack Auth NOT the Issue**
   - API routes bypass Stack Auth middleware
   - OAuth flow doesn't depend on Stack Auth session
   - Only the final redirect to /settings requires auth (which user already has)

## Conclusion

**Is Stack Auth causing the issue?**
**Most likely NO**, because:
- API routes explicitly bypass Stack Auth middleware
- Square OAuth callback is an API route
- The only Stack Auth touchpoint is the final redirect to /settings, which requires the user to be logged in (which they already are)

**More likely causes:**
- Environment variable configuration
- Square dashboard redirect URI mismatch
- Token exchange errors (wrong client_id or client_secret)

**Next Step**: Add comprehensive logging to callback route and check Vercel logs during OAuth flow to see exactly where it's failing.
