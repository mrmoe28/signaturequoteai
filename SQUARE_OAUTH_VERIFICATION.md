# Square OAuth Integration - Verification Checklist

## Deployment Status
- **Latest Deployment**: 3 minutes ago (Ready ✅)
- **Production URL**: https://signaturequoteai-main.vercel.app
- **Last Commits**:
  - `e4b21aa` - fix: use correct Square OAuth environment variables in callback
  - `ab1217f` - feat: implement user-specific Square OAuth integration

## Issues Fixed (Not Yet Verified)

### 1. Next.js 14+ API Route Compatibility ✅ Deployed
**File**: `app/api/users/[id]/square-status/route.ts`
**Fix**: Changed params to Promise type and added await
```typescript
{ params }: { params: Promise<{ id: string }> }
const { id: userId } = await params;
```

### 2. Missing User Handling ✅ Deployed
**File**: `app/api/users/[id]/square-status/route.ts`
**Fix**: Return default "not connected" state instead of 404 when user doesn't exist
```typescript
if (!user) {
  return NextResponse.json({
    squareConnected: false,
    squareMerchantId: null,
    squareLocationId: null,
    squareEnvironment: null,
    squareConnectedAt: null,
  });
}
```

### 3. Database Upsert Pattern ✅ Deployed
**File**: `app/api/integrations/square/callback/route.ts`
**Fix**: Changed from UPDATE to INSERT with ON CONFLICT DO UPDATE
**Critical Discovery**: Users table was empty (0 rows) - OAuth was "succeeding" but not saving data
```typescript
await db
  .insert(users)
  .values({
    id: userId,
    email: `user-${userId.substring(0, 8)}@stack-auth.temp`,
    squareMerchantId: merchant_id,
    squareAccessToken: access_token,
    // ... other fields
  })
  .onConflictDoUpdate({
    target: users.id,
    set: { /* updates */ }
  });
```

### 4. Content Security Policy Headers ✅ Deployed
**File**: `next.config.mjs`
**Fix**: Added comprehensive CSP configuration allowing all Square domains
```javascript
"connect-src 'self' https://connect.squareup.com https://connect.squareupsandbox.com https://pci-connect.squareup.com https://pci-connect.squareupsandbox.com ...",
"frame-src 'self' https://connect.squareup.com https://connect.squareupsandbox.com ...",
"form-action 'self' https://connect.squareup.com https://connect.squareupsandbox.com"
```

## Verification Steps (NOT YET PERFORMED)

### Step 1: Check Production Deployment
- [ ] Visit https://signaturequoteai-main.vercel.app/settings
- [ ] Open Browser DevTools (F12) → Console tab
- [ ] Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R) to clear cache

### Step 2: Verify CSP Headers
- [ ] Check Console for CSP errors (should be NONE)
- [ ] Look for: "Refused to connect to... violates Content Security Policy"
- [ ] If CSP errors appear → CSP configuration incomplete

### Step 3: Test Square OAuth Flow
- [ ] Click "Connect Square Account" button
- [ ] Verify redirects to Square OAuth page (should be smooth, no errors)
- [ ] Authorize the connection
- [ ] Verify redirects back to `/settings?success=square_connected`
- [ ] Check Console for errors during redirect flow

### Step 4: Verify Connection Status Display
- [ ] After OAuth completion, Settings page should show:
  - ✅ Green success message at top
  - ✅ "Connected" status in Square Integration card
  - ✅ Merchant ID displayed
  - ✅ Location ID displayed
  - ✅ Connected timestamp displayed

### Step 5: Verify Database Persistence
- [ ] Connect to NeonDB: `psql $DATABASE_URL`
- [ ] Run: `SELECT id, email, "squareMerchantId", "squareEnvironment", "squareConnectedAt" FROM users;`
- [ ] Verify user record exists with Square credentials populated
- [ ] **Critical**: Table should NOT be empty (was 0 rows before fix)

### Step 6: Verify API Endpoint
- [ ] Open DevTools → Network tab
- [ ] Refresh Settings page
- [ ] Find request to: `/api/users/[userId]/square-status`
- [ ] Verify response:
  ```json
  {
    "squareConnected": true,
    "squareMerchantId": "ML...",
    "squareLocationId": "L...",
    "squareEnvironment": "production",
    "squareConnectedAt": "2025-10-15T..."
  }
  ```
- [ ] Status should be 200, NOT 404

## Known Issues to Watch For

### Issue: Still Not Connecting
**Possible Causes**:
1. **CSP Still Blocking**: Check browser console for CSP errors
2. **OAuth Callback Failing**: Check Vercel logs for callback route errors
3. **Database Not Updating**: Check NeonDB users table directly
4. **Wrong Environment Variables**: Verify Vercel env vars match Square dashboard

### Issue: CSP Errors Persist
**Solution**: Check that CSP includes ALL required Square domains:
- OAuth: `connect.squareup.com`, `connect.squareupsandbox.com`
- Web SDK: `web.squarecdn.com`, `sandbox.web.squarecdn.com`
- PCI: `pci-connect.squareup.com`, `pci-connect.squareupsandbox.com`

### Issue: User Not Found in Database
**Solution**: The upsert pattern should handle this now, but verify:
- Stack Auth `userId` is being passed correctly in OAuth state parameter
- Email field is not null (using temp email format)

## Debug Commands

### Check Recent Deployments
```bash
vercel ls | head -n 5
```

### Check Deployment Logs
```bash
vercel logs $(vercel ls --json | jq -r '.[0].url')
```

### Check Database
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT id, \"squareMerchantId\", \"squareConnectedAt\" FROM users;"
```

### Check Environment Variables
```bash
vercel env pull .env.local
grep SQUARE .env.local
```

## Success Criteria

✅ **OAuth Integration Working** when ALL of these are true:
1. No CSP errors in browser console
2. OAuth redirect flow completes without errors
3. Settings page shows "Connected" status with details
4. Database has user record with Square credentials
5. API endpoint returns `squareConnected: true`
6. Can generate quote with Square payment link

## Current Status: ⏳ AWAITING VERIFICATION

All code fixes have been deployed to production (3 minutes ago).
**Next Action**: User must test the Square OAuth flow to verify it works.

**DO NOT MARK AS FIXED** until user confirms:
- Square OAuth connection completes successfully
- Settings page displays connection status correctly
- No errors in browser console or Vercel logs

---

**Reference**: See `STACK_AUTH_SQUARE_ANALYSIS.md` for detailed investigation notes.
