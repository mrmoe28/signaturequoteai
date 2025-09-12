# Deployment Workflow Rules

## CRITICAL RULE: Never Deploy Directly to Vercel

- **NEVER** run `vercel --prod` or any direct deployment commands
- **ONLY** push changes to GitHub
- **Vercel deploys automatically** from GitHub pushes
- **DO NOT** bypass the GitHub → Vercel workflow

## Correct Workflow:

1. Make code changes
2. Test locally with `npm run build`
3. Commit changes with `git add . && git commit -m "message"`
4. Push to GitHub with `git push origin branch-name`
5. Vercel automatically deploys from GitHub

## What NOT to do:

- ❌ `vercel --prod`
- ❌ `vercel deploy`
- ❌ Any direct Vercel deployment commands
- ❌ Bypassing GitHub workflow

## What TO do:

- ✅ `git push origin main` (or appropriate branch)
- ✅ Let Vercel handle deployment automatically
- ✅ Check Vercel dashboard for deployment status
