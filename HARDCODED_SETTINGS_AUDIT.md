# Hardcoded Settings Audit Report

## Summary
Comprehensive audit of hardcoded values throughout the application, identifying areas where settings should be fetched from the database instead of being hardcoded.

## ✅ Fixed Issues

### 1. Square Integration Settings
**Location**: `app/(app)/settings/page.tsx`
- ❌ Before: `squareConnected={false}` (hardcoded)
- ✅ After: Fetches from `/api/users/[id]/square-status`
- **Status**: FIXED ✅

### 2. Square Environment Default
**Location**: `lib/db/schema.ts`
- ❌ Before: `.default('sandbox')` in schema
- ✅ After: No default, set only via OAuth
- **Status**: FIXED ✅

### 3. Square Disconnect Environment
**Location**: `app/api/integrations/square/disconnect/route.ts`
- ❌ Before: Set to `'sandbox'` on disconnect
- ✅ After: Set to `null` on disconnect
- **Status**: FIXED ✅

## ⚠️ Identified Issues (Not Yet Fixed)

### 4. User Settings (High Priority)
**Location**: `app/(app)/settings/page.tsx:45-64`

**Current State**: All user settings are hardcoded in `useState`:
```typescript
const [settings, setSettings] = useState({
  // Notification Settings
  emailNotifications: true,
  quoteNotifications: true,
  productUpdates: false,

  // Display Settings
  theme: 'light',
  language: 'en',
  timezone: 'America/New_York',

  // Security Settings
  twoFactorAuth: false,
  sessionTimeout: 30,

  // Quote Settings
  defaultQuoteValidity: 30,
  autoSaveQuotes: true,
  defaultCurrency: 'USD',

  // Email Settings
  emailSignature: 'Best regards,\n[Your Name]\n[Your Title]\n[Company Name]',
});
```

**Impact**:
- Users cannot save/persist their settings
- Settings reset on page reload
- "Save Settings" button doesn't actually save anywhere

**Recommendation**:
1. Create database table for user settings
2. Add API endpoint: `/api/users/[id]/settings`
3. Fetch settings on component mount
4. Actually save settings when user clicks "Save"

### 5. Company Settings
**Location**: Needs verification

**Check**: Are company settings (name, logo, terms) stored in database or hardcoded?

**Recommendation**: Verify if company settings are properly persisted.

## 📊 Hardcoded Values That Are OK

These are intentional defaults and don't need to be changed:

### UI Component Defaults
- Image placeholders: `/images/placeholder.svg`
- Button variants: `'default'`, `'outline'`
- Component sizes: `'default'`, `'sm'`, `'lg'`

### Environment Defaults
- `process.env.SQUARE_ENVIRONMENT || 'sandbox'` - Good fallback
- `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'` - Good for development

### Form Defaults
- Empty string defaults: `''`
- Zero defaults for numbers: `0`
- Empty array defaults: `[]`

## 🎯 Priority Fixes Needed

### Priority 1: User Settings Persistence
**Estimated Effort**: 2-3 hours
**Files to Create**:
1. `app/api/users/[id]/settings/route.ts` - GET/PUT endpoint
2. Database migration for `user_settings` table or add columns to `users` table
3. Update `app/(app)/settings/page.tsx` to fetch/save

**Steps**:
1. Design settings schema (which settings to store)
2. Create database migration
3. Implement GET endpoint to fetch settings
4. Implement PUT endpoint to save settings
5. Update frontend to use API
6. Add loading/error states

### Priority 2: Company Settings Verification
**Estimated Effort**: 30 minutes
**Check**:
- Company name
- Company logo
- Email footer/signature
- Terms & conditions
- Default quote validity

## 🔍 Search Patterns Used

```bash
# Search for hardcoded Square settings
grep -rn "squareConnected.*false\|squareEnvironment.*sandbox"

# Search for useState with hardcoded values
grep -rn "useState({" app/

# Search for defaultValue props
grep -rn "defaultValue=" app/

# Search for hardcoded IDs
grep -rn "userId:\|merchantId:" | grep "null\|''\|\"\""
```

## ✅ Recommendations

1. **Create User Settings Schema**:
   ```typescript
   interface UserSettings {
     // Notifications
     emailNotifications: boolean;
     quoteNotifications: boolean;
     productUpdates: boolean;

     // Display
     theme: 'light' | 'dark' | 'auto';
     language: string;
     timezone: string;

     // Security
     twoFactorAuth: boolean;
     sessionTimeout: number;

     // Quote Defaults
     defaultQuoteValidity: number;
     autoSaveQuotes: boolean;
     defaultCurrency: string;
     emailSignature: string;
   }
   ```

2. **Store in Database**:
   - Option A: Add columns to `users` table
   - Option B: Create separate `user_settings` table
   - Recommended: Option B (better normalization)

3. **API Endpoints**:
   - `GET /api/users/[id]/settings` - Fetch user settings
   - `PUT /api/users/[id]/settings` - Save user settings
   - Return 404 if no settings exist, use defaults

4. **Frontend Updates**:
   - Fetch settings on mount
   - Show loading state while fetching
   - Save to API when user clicks "Save Settings"
   - Show success/error messages

## 📝 Next Steps

1. ✅ Fix Square hardcoded settings (DONE)
2. ⏳ Fix user settings persistence (TODO)
3. ⏳ Verify company settings (TODO)
4. ⏳ Create settings migration (TODO)
5. ⏳ Implement settings API (TODO)

---

**Last Updated**: $(date)
**Audit By**: Claude Code
