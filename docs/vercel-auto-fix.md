# Vercel Auto-Fix - Automated Deployment Repair

The Vercel Auto-Fix system uses ChatGPT to automatically diagnose and repair Vercel deployment failures.

## Quick Start

### 1. Set Up API Key

Add your OpenAI API key to your environment:

```bash
# Option 1: Add to .env file
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# Option 2: Export in your shell
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o-mini  # optional, defaults to gpt-4o-mini
```

### 2. Run Auto-Fix

When your Vercel build fails, run:

```bash
npm run mcp:vercel
```

This will:
1. Read your project context (from `claude.md` or `.claude.md`)
2. Run pre-checks for common Vercel issues
3. Execute the build and capture errors
4. Gather relevant repository files
5. Analyze the failure with ChatGPT
6. Apply suggested code patches
7. Re-run the build to validate
8. Generate a detailed report

### 3. Advanced Usage

#### Custom Build Command

```bash
npm run mcp:vercel-once -- --cmd "npm run build:prod"
```

#### Include Specific Files

```bash
npm run mcp:vercel-once -- --files "src/**/*.{ts,tsx},app/**/*.ts"
```

#### Add Context Question

```bash
npm run mcp:vercel-once -- --question "Focus on Edge runtime compatibility issues"
```

#### Full Example

```bash
npm run mcp:vercel-once -- \
  --cmd "npm run build" \
  --title "Edge runtime deployment failure" \
  --files "middleware.ts,app/api/**/*.ts" \
  --question "Check for Node.js APIs used in Edge runtime"
```

## Output Locations

### Logs
Build output is saved to:
```
.mcp/logs/<timestamp>.log
```

### Reports
Detailed analysis reports are saved to:
```
.mcp/reports/<timestamp>.md
```

Reports include:
- Root cause analysis
- Fix plan
- Applied patches
- Environment variable requirements
- Final build output

### Backups
Original files are backed up before patching to:
```
.mcp/backups/<filepath>.<timestamp>
```

## Environment Variables

If the analysis detects missing environment variables, you'll see:

```
🔐 Required Environment Variables:
   Set these in Vercel dashboard or CLI:

   vercel env add DATABASE_URL production
   vercel env add AUTH_SECRET production
```

### Setting Environment Variables

**Via Vercel CLI:**
```bash
vercel env add ENV_VAR_NAME production
# Then enter the value when prompted
```

**Via Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each required variable
4. Redeploy

## Common Vercel Issues Detected

The auto-fix system checks for:

### 1. Node.js Version Compatibility
- Vercel supports Node 18.x, 20.x, 22.x
- Suggests: `"engines": {"node": ">=20.11 <=22"}`

### 2. Next.js 15+ SWC Dependencies
- Next.js 15+ requires platform-specific SWC binaries
- Suggests adding `@next/swc-*` to `optionalDependencies`

### 3. ESLint Blocking Builds
- Detects if ESLint errors prevent builds
- Suggests: `eslint.ignoreDuringBuilds = true` or fix errors

### 4. Edge Runtime Compatibility
- Detects Node.js APIs used in Edge runtime
- Suggests switching to `nodejs` runtime or using dynamic imports

### 5. Prisma Configuration
- Checks for missing `postinstall` script
- Suggests: `"postinstall": "prisma generate"`

### 6. Browser Automation
- Detects Playwright/Puppeteer usage
- Suggests using `@sparticuz/chromium` for Vercel

## Iteration & Retry Logic

The auto-fix system will:
1. Apply initial patches from ChatGPT
2. Re-run the build
3. If still failing, analyze the NEW errors
4. Apply additional patches
5. Retry up to **3 total attempts**

This iterative approach handles complex errors that require multiple fixes.

## Best Practices

### 1. Provide Context
Always maintain a `claude.md` or `.claude.md` file with:
- Project architecture overview
- Tech stack details
- Known deployment considerations
- Environment variable documentation

### 2. Review Patches
After auto-fix succeeds, review the applied patches:
```bash
git diff
```

### 3. Commit Fixes
Once validated, commit the fixes:
```bash
git add .
git commit -m "fix: apply Vercel deployment fixes from auto-fix"
git push
```

### 4. Manual Environment Setup
After fixing code, ensure all required environment variables are set in Vercel before redeploying.

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"
- Ensure your `.env` file exists and contains the API key
- Or export it in your shell before running

### "Failed to get valid response"
- Check your OpenAI API key is valid
- Ensure you have credits available
- Try a different model: `export OPENAI_MODEL=gpt-4`

### Patches Not Applying
- Check `.mcp/backups/` for original files
- Review the report in `.mcp/reports/` for details
- Manually apply suggested changes if needed

### Build Still Failing
- Review the final report for environment variable requirements
- Check Vercel logs for runtime errors (not build errors)
- Consider running with more context:
  ```bash
  npm run mcp:vercel-once -- --files "**/*.{ts,tsx,js,jsx}"
  ```

## Integration with CI/CD

You can integrate auto-fix into your CI/CD pipeline:

```yaml
# .github/workflows/vercel-fix.yml
name: Auto-Fix Vercel Deployment

on:
  workflow_dispatch:

jobs:
  fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm install

      - name: Run Auto-Fix
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npm run mcp:vercel

      - name: Commit Fixes
        if: success()
        run: |
          git config user.name "Auto-Fix Bot"
          git config user.email "bot@yourapp.com"
          git add .
          git commit -m "fix: auto-fix Vercel deployment issues"
          git push
```

## Architecture

### Files

- **`src/mcp/vercelAutoFix.ts`** - Main driver with heuristics
- **`src/mcp/chatgptClient.ts`** - OpenAI API wrapper with deployment analysis
- **`src/mcp/harvest.ts`** - Log capture and file gathering
- **`src/mcp/applyPatches.ts`** - Safe patch application with backups

### Workflow

1. **Pre-checks** - Run heuristics for common issues
2. **Context Gathering** - Read project docs and config files
3. **Build Execution** - Run and capture build output
4. **File Collection** - Gather relevant source files
5. **AI Analysis** - ChatGPT analyzes errors and suggests fixes
6. **Patch Application** - Apply code changes with backups
7. **Validation** - Re-run build to verify fixes
8. **Iteration** - Repeat if needed (up to 3 attempts)
9. **Reporting** - Generate detailed markdown report

### Safety Features

- **Backups** - All modified files are backed up before patching
- **Validation** - TypeScript compilation checked after edits
- **Rollback** - Failed patches are automatically restored
- **Minimal Changes** - AI instructed to make smallest safe edits
- **Never Invents Files** - AI cannot create non-existent files

## Support

For issues or questions:
- Check `.mcp/reports/` for detailed analysis
- Review `.mcp/logs/` for full build output
- Examine `.mcp/backups/` if rollback needed
- Open an issue in the repository
