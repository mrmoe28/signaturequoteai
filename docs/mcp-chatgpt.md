# ChatGPT MCP Auto-Debugging

This project includes an automated debugging system powered by ChatGPT via the Model Context Protocol (MCP). It automatically analyzes build/test errors, proposes fixes, and applies code patches.

## Setup

### 1. Install Dependencies

```bash
npm install
```

Required packages:
- `openai` - OpenAI API client
- `jsonc-parser` - JSON with comments parser
- `fast-glob` - File pattern matching
- `tsx` - TypeScript execution (already installed)

### 2. Configure OpenAI API Key

Add your OpenAI API key to `.env.local`:

```bash
echo "OPENAI_API_KEY=sk-your-key-here" >> .env.local
echo "OPENAI_MODEL=gpt-4o-mini" >> .env.local
```

Or export in your shell:

```bash
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o-mini
```

**Note**: `gpt-4o-mini` is recommended for cost-effectiveness. You can also use `gpt-4` or `gpt-4-turbo` for more complex debugging.

## Usage

### Quick Commands

**Auto-debug build errors:**
```bash
npm run mcp:auto
```

**Auto-debug test failures:**
```bash
npm run mcp:test
```

**Custom command:**
```bash
npm run mcp:once -- --cmd "npm run lint" --title "Lint errors"
```

### Advanced Usage

**With custom file globs:**
```bash
tsx src/mcp/autoDebug.ts \
  --cmd "npm run build" \
  --title "Build error" \
  --files "src/**/*.ts,lib/**/*.ts"
```

**With additional context:**
```bash
tsx src/mcp/autoDebug.ts \
  --cmd "npm test" \
  --title "API tests failing" \
  --question "Focus on authentication-related issues"
```

**Custom max iterations:**
```bash
tsx src/mcp/autoDebug.ts \
  --cmd "npm run build" \
  --title "Build error" \
  --maxIterations 5
```

## How It Works

### 1. Run & Capture
The system runs your command (e.g., `npm run build`) and captures stdout/stderr to a timestamped log file in `.mcp/logs/`.

### 2. Extract Context
- Extracts file paths mentioned in error logs
- Reads up to 8 relevant code files for context
- Gathers last ~1500 lines of error output

### 3. Analyze with ChatGPT
- Sends error context to ChatGPT via OpenAI API
- Requests structured JSON response with:
  - Error summary
  - Root cause analysis
  - Step-by-step fix plan
  - Minimal code patches

### 4. Apply Patches
- Creates backups in `.mcp/backups/` before modifying files
- Applies code patches (full file or line range replacements)
- Validates TypeScript/JavaScript syntax
- Rolls back on validation failure

### 5. Retry Loop
- Re-runs the original command after patches
- If still failing, repeats analysis with new error logs
- Maximum 3 iterations by default
- Stops on success or max iterations reached

### 6. Generate Report
- Creates markdown report in `.mcp/reports/`
- Includes all iterations, analyses, patches, and outcomes
- Logs and diffs for each attempt

## File Structure

```
mcp/
├── servers/
│   └── chatgpt.server.jsonc    # MCP server configuration
src/mcp/
├── chatgptClient.ts            # OpenAI API wrapper
├── harvest.ts                  # Log capture and file collection
├── applyPatches.ts             # Patch application with backup/rollback
├── diff.ts                     # Unified diff generator
└── autoDebug.ts                # Main CLI orchestrator
.mcp/
├── logs/                       # Captured command outputs (gitignored)
├── backups/                    # File backups before patching (gitignored)
└── reports/                    # Markdown reports (gitignored)
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY` (required) - Your OpenAI API key
- `OPENAI_MODEL` (optional) - Model to use (default: `gpt-4o-mini`)

### MCP Server Config

See `mcp/servers/chatgpt.server.jsonc` for HTTP transport configuration:
- Base URL: `https://api.openai.com/v1`
- Authentication: Bearer token from `OPENAI_API_KEY`
- Endpoints: `/chat/completions`, `/embeddings`
- Timeouts: 8s connect, 60s read

## Best Practices

### When to Use
- **Build errors** after dependency updates
- **Type errors** in TypeScript projects
- **Test failures** with clear error messages
- **ESLint/syntax errors** in batches

### When NOT to Use
- Logic bugs requiring deep domain knowledge
- Performance optimization (requires profiling first)
- Security vulnerabilities (requires manual review)
- Database schema changes (requires migration planning)

### Tips
1. **Start small**: Run on a single failing command first
2. **Review patches**: Always check `.mcp/reports/` before committing
3. **Keep backups**: Backups in `.mcp/backups/` are timestamped; don't delete immediately
4. **Limit scope**: Use `--files` to focus on specific directories
5. **Ask questions**: Use `--question` to guide the analysis

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"
- Ensure you've added the key to `.env.local` or exported it in your shell
- Verify the key starts with `sk-`

### "Failed to get valid response after 2 attempts"
- Check your internet connection
- Verify API key is valid (not expired or rate-limited)
- Try a different model (e.g., `gpt-4-turbo`)

### "Syntax validation failed, rolled back"
- The patch caused syntax errors
- Check the report for details
- Original file restored from backup

### Patches don't fix the issue
- Try increasing `--maxIterations`
- Provide more context with `--files`
- Add a specific `--question` to guide analysis
- Some issues require manual intervention

### Too many files collected
- Use `--files` to narrow down file globs
- Ensure error logs contain relevant file paths
- Check that files aren't too large (max 50KB per file)

## Cost Considerations

Using `gpt-4o-mini`:
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Typical analysis: 5K-15K tokens
- Cost per run: ~$0.001-0.01

Using `gpt-4`:
- ~$30 per 1M input tokens (200x more expensive)
- Only use for complex issues

## Cleanup

**Remove old logs** (keeps last 50):
```bash
# Automatic on each run
```

**Manual cleanup**:
```bash
rm -rf .mcp/logs/*
rm -rf .mcp/backups/*
rm -rf .mcp/reports/*
```

## Examples

### Example 1: Build Error

```bash
npm run mcp:auto
```

Output:
```
🔍 Auto-Debug Chain Starting
Command: npm run build
Title: Build error
Max Iterations: 3

━━━ Iteration 1/3 ━━━

Running: npm run build...
Exit code: 1

Extracted 3 file paths from logs
Collecting code files for context...
Collected 5 files (max 8)

🤖 Analyzing error with ChatGPT...

📋 Analysis Complete
Summary: Type error in UserProfile component - missing required prop 'email'
Root Cause: src/components/UserProfile.tsx line 42 expects email prop but parent doesn't pass it
Fix Plan:
1. Add email prop to UserProfile props interface
2. Pass email from parent component
3. Add null check for optional email

🔧 Applying 2 patches...

Applying patch to src/components/UserProfile.tsx...
✓ Applied successfully (+3 -1)
  Backup: .mcp/backups/UserProfile.tsx.2024-01-15-10-30-00

Applying patch to src/app/profile/page.tsx...
✓ Applied successfully (+2 -0)
  Backup: .mcp/backups/page.tsx.2024-01-15-10-30-05

━━━ Iteration 2/3 ━━━

Running: npm run build...
Exit code: 0

✓ No errors detected! Command succeeded.

📄 Generating report...
Report saved: .mcp/reports/2024-01-15-10-30-10.md

✅ Success! Issue resolved.
```

### Example 2: Test Failure

```bash
npm run mcp:test
```

### Example 3: Custom Analysis

```bash
tsx src/mcp/autoDebug.ts \
  --cmd "npm run typecheck" \
  --title "Type errors after React 19 upgrade" \
  --files "src/**/*.tsx" \
  --question "Focus on React type definition mismatches"
```

## Integration with CI/CD

You can integrate auto-debug into your CI pipeline for self-healing builds:

```yaml
# .github/workflows/auto-debug.yml
name: Auto-Debug on Failure

on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - name: Build with auto-fix
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npm run mcp:auto || true
      - name: Create PR if fixed
        if: failure()
        uses: peter-evans/create-pull-request@v5
        with:
          title: "Auto-fix: Build errors"
          body: "Automated fixes applied by ChatGPT MCP"
```

**Note**: Be cautious with automated commits. Always review patches before merging.

## Disable Auto-Debug Loop

If you don't want the auto-debug system, simply:
1. Don't export `OPENAI_API_KEY`
2. Don't run `mcp:*` scripts
3. Optionally remove `src/mcp/` directory

The scripts are opt-in and don't affect normal development workflow.

## Support

- For MCP issues: Check OpenAI API status and key validity
- For patch issues: Review `.mcp/reports/` for details
- For feature requests: Open an issue in the repository

## License

Same as parent project.
