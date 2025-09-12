# Google OAuth Troubleshooting (NextAuth v5)

This guide fixes the Google sign-in error:

- Screen shows: "Access blocked: Authorization Error"
- Footer shows: "Error 400: invalid_request"

## Root causes to check (in order)

1) Missing/incorrect OAuth redirect URIs in Google Cloud
2) Wrong `NEXTAUTH_URL` or environment mismatch
3) OAuth consent screen in Testing but user not added as a Test User
4) Using wrong OAuth client type (must be Web application)
5) Missing env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`

---

## Required configuration

### A. Google Cloud Console

- Create OAuth 2.0 Client ID of type: Web application
- Authorized JavaScript origins:
  - Local: `http://localhost:3000`
- Authorized redirect URIs:
  - Local: `http://localhost:3000/api/auth/callback/google`
- For deployed envs, add for each domain:
  - Origin: `https://<your-domain>`
  - Redirect: `https://<your-domain>/api/auth/callback/google`

If OAuth consent screen is in Testing, add the Google accounts that will sign in as Test users.

### B. Environment variables

Add to `.env.local` for development:

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate a strong random string>"
GOOGLE_CLIENT_ID="<from Google Cloud>"
GOOGLE_CLIENT_SECRET="<from Google Cloud>"
```

In Vercel, add the same (with your production URL for `NEXTAUTH_URL`).

> Tip: Visit `/api/test-env` in the app to verify presence of these variables without exposing values.
