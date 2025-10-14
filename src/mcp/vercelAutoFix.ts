#!/usr/bin/env tsx
/**
 * Vercel Auto-Fix - Automated deployment error diagnosis and repair
 *
 * Analyzes Vercel build failures, applies AI-suggested patches, and validates fixes.
 * Includes heuristics for common Vercel deployment issues.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { analyzeDeployment, type DeploymentAnalysis } from './chatgptClient';
import { runAndCapture, readClaudeContext, gatherFiles, extractFilePaths, readFileSafe } from './harvest';
import { applyPatches } from './applyPatches';

interface VercelHeuristic {
  check: (pkg: any, files: Map<string, string>) => boolean;
  suggestion: string;
  autofixable: boolean;
}

// Common Vercel deployment issues and fixes
const VERCEL_HEURISTICS: VercelHeuristic[] = [
  {
    check: (pkg) => {
      const nodeVersion = pkg.engines?.node;
      if (!nodeVersion) return false;
      // Vercel supports Node 18.x, 20.x, 22.x
      return !nodeVersion.match(/>=?\s*(18|20|22)/);
    },
    suggestion: 'Node.js version may be incompatible with Vercel. Recommended: "engines": {"node": ">=20.11 <=22"}',
    autofixable: false,
  },
  {
    check: (pkg) => {
      const nextVersion = pkg.dependencies?.next;
      if (!nextVersion) return false;
      const isNext15Plus = nextVersion.match(/^[\^~]?(15|16|17)/);
      const hasSWC = pkg.optionalDependencies?.['@next/swc-darwin-arm64'] ||
                     pkg.optionalDependencies?.['@next/swc-linux-x64-gnu'];
      return isNext15Plus && !hasSWC;
    },
    suggestion: 'Next.js 15+ requires SWC binaries in optionalDependencies. Add platform-specific @next/swc-* packages.',
    autofixable: false,
  },
  {
    check: (pkg, files) => {
      const nextConfig = files.get('next.config.js') || files.get('next.config.ts') || files.get('next.config.mjs') || '';
      return nextConfig.includes('eslint:') && nextConfig.includes('ignoreDuringBuilds: false');
    },
    suggestion: 'ESLint errors blocking build. Consider: eslint.ignoreDuringBuilds = true, or fix lint errors first.',
    autofixable: false,
  },
  {
    check: (pkg, files) => {
      const nextConfig = files.get('next.config.js') || files.get('next.config.ts') || files.get('next.config.mjs') || '';
      return nextConfig.includes('runtime: \'edge\'') && nextConfig.includes('require(');
    },
    suggestion: 'Edge runtime detected with Node.js-only APIs (require). Switch to nodejs runtime or use dynamic imports.',
    autofixable: false,
  },
  {
    check: (pkg) => {
      return pkg.dependencies?.prisma && !pkg.scripts?.postinstall?.includes('prisma generate');
    },
    suggestion: 'Prisma detected without postinstall script. Add: "postinstall": "prisma generate"',
    autofixable: false,
  },
  {
    check: (pkg) => {
      return (pkg.dependencies?.playwright || pkg.dependencies?.puppeteer) &&
             !pkg.dependencies?.['@sparticuz/chromium'];
    },
    suggestion: 'Browser automation detected. For Vercel, use @sparticuz/chromium instead of bundled browsers.',
    autofixable: false,
  },
];

/**
 * Run pre-checks and return heuristic suggestions
 */
async function runHeuristics(): Promise<string[]> {
  const suggestions: string[] = [];

  try {
    const pkgContent = await readFileSafe('package.json');
    if (!pkgContent) return suggestions;

    const pkg = JSON.parse(pkgContent);
    const fileMap = new Map<string, string>();

    // Load config files
    const configs = ['next.config.js', 'next.config.ts', 'next.config.mjs'];
    for (const config of configs) {
      const content = await readFileSafe(config);
      if (content) fileMap.set(config, content);
    }

    // Run all heuristics
    for (const heuristic of VERCEL_HEURISTICS) {
      if (heuristic.check(pkg, fileMap)) {
        suggestions.push(heuristic.suggestion);
      }
    }
  } catch (error) {
    console.warn('Heuristic check failed:', error);
  }

  return suggestions;
}

/**
 * Ensure required directories exist
 */
async function ensureDirs(): Promise<void> {
  const dirs = ['.mcp/logs', '.mcp/reports', '.mcp/backups'];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Generate deployment report
 */
async function writeReport(
  timestamp: string,
  analysis: DeploymentAnalysis,
  appliedPatches: string[],
  finalStatus: 'success' | 'failure',
  buildOutput?: string
): Promise<string> {
  const reportPath = path.join('.mcp/reports', `${timestamp}.md`);

  const content = `# Vercel Auto-Fix Report
**Generated**: ${new Date().toISOString()}
**Status**: ${finalStatus}

## Root Cause
${analysis.rootCause}

## Fix Plan
${analysis.fixPlan}

## Applied Patches
${appliedPatches.length > 0 ? appliedPatches.map(p => `- ${p}`).join('\n') : 'None'}

## Environment Variables
${analysis.envAdvice ? `
### Required
${analysis.envAdvice.required.map(v => `- ${v}`).join('\n')}

${analysis.envAdvice.optional?.length ? `### Optional\n${analysis.envAdvice.optional.map(v => `- ${v}`).join('\n')}` : ''}

${analysis.envAdvice.notes ? `### Notes\n${analysis.envAdvice.notes}` : ''}
` : 'No environment advice provided'}

## Final Build Output
\`\`\`
${buildOutput || 'N/A'}
\`\`\`
`;

  await fs.writeFile(reportPath, content, 'utf-8');
  return reportPath;
}

/**
 * Main auto-fix workflow
 */
async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string, defaultValue: string = '') => {
    const index = args.indexOf(name);
    return index >= 0 && args[index + 1] ? args[index + 1] : defaultValue;
  };

  const cmd = getArg('--cmd', 'npm run build');
  const title = getArg('--title', 'Vercel build failure');
  const filesGlob = getArg('--files');
  const question = getArg('--question');

  console.log('🔧 Vercel Auto-Fix starting...\n');

  // 1. Ensure directories
  await ensureDirs();

  // 2. Read project context
  console.log('📖 Reading project context...');
  const claudeContext = await readClaudeContext();

  // 3. Run heuristics
  console.log('🔍 Running pre-checks...');
  const heuristics = await runHeuristics();
  if (heuristics.length > 0) {
    console.log('\n⚠️  Heuristic Suggestions:');
    heuristics.forEach(h => console.log(`   • ${h}`));
    console.log();
  }

  // 4. Run build and capture output
  console.log(`🏗️  Running: ${cmd}`);
  const buildResult = await runAndCapture(cmd);

  if (buildResult.exitCode === 0) {
    console.log('✅ Build succeeded - no errors detected');
    return;
  }

  console.log(`❌ Build failed (exit code ${buildResult.exitCode})`);

  // 5. Gather context files
  console.log('📂 Gathering repository files...');
  const customGlobs = filesGlob ? filesGlob.split(',') : undefined;
  const files = await gatherFiles(customGlobs);

  // Add files mentioned in errors
  const errorPaths = extractFilePaths(buildResult.output);
  for (const errorPath of errorPaths.slice(0, 5)) {
    const content = await readFileSafe(errorPath);
    if (content && !files.find(f => f.path === errorPath)) {
      files.push({ path: errorPath, content });
    }
  }

  console.log(`   Collected ${files.length} files`);

  // 6. Get last 1500 lines of logs
  const logLines = buildResult.output.split('\n');
  const tailLogs = logLines.slice(-1500).join('\n');

  // 7. Analyze with ChatGPT
  console.log('\n🤖 Analyzing with ChatGPT...');
  const analysis = await analyzeDeployment({
    title,
    logs: tailLogs,
    files,
    claudeContext,
    question: question || heuristics.join('\n'),
  });

  console.log('\n📊 Analysis Complete:');
  console.log(`   Summary: ${analysis.summary}`);
  console.log(`   Root Cause: ${analysis.rootCause}`);
  console.log(`\n   Fix Plan:\n   ${analysis.fixPlan.replace(/\n/g, '\n   ')}\n`);

  // 8. Apply patches
  const appliedPatches: string[] = [];
  if (analysis.patches.length > 0) {
    console.log('🔨 Applying patches...');
    const results = await applyPatches(analysis.patches);

    results.forEach(result => {
      if (result.success) {
        console.log(`   ✅ ${result.path}`);
        appliedPatches.push(result.path);
      } else {
        console.log(`   ❌ ${result.path}: ${result.error}`);
      }
    });
  }

  // 9. Re-run build
  console.log('\n🔄 Re-running build...');
  const retryResult = await runAndCapture(cmd);

  let finalStatus: 'success' | 'failure' = 'failure';
  let attempts = 1;

  if (retryResult.exitCode === 0) {
    console.log('✅ Build succeeded after applying patches!');
    finalStatus = 'success';
  } else {
    // Try up to 2 more iterations
    while (attempts < 3 && retryResult.exitCode !== 0) {
      console.log(`\n🔁 Attempt ${attempts + 1}/3 - analyzing new errors...`);

      const newTailLogs = retryResult.output.split('\n').slice(-1500).join('\n');
      const newAnalysis = await analyzeDeployment({
        title: `${title} (iteration ${attempts + 1})`,
        logs: newTailLogs,
        files,
        claudeContext,
      });

      console.log(`   New fix plan: ${newAnalysis.fixPlan}`);

      if (newAnalysis.patches.length > 0) {
        const newResults = await applyPatches(newAnalysis.patches);
        newResults.forEach(r => r.success && appliedPatches.push(r.path));
      }

      const finalBuild = await runAndCapture(cmd);
      if (finalBuild.exitCode === 0) {
        console.log('✅ Build succeeded!');
        finalStatus = 'success';
        break;
      }

      attempts++;
    }

    if (finalStatus === 'failure') {
      console.log('❌ Build still failing after all attempts');
    }
  }

  // 10. Write report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = await writeReport(
    timestamp,
    analysis,
    appliedPatches,
    finalStatus,
    retryResult.output.split('\n').slice(-100).join('\n')
  );

  console.log(`\n📄 Report saved: ${reportPath}`);

  // 11. Show environment advice
  if (analysis.envAdvice && analysis.envAdvice.required.length > 0) {
    console.log('\n🔐 Required Environment Variables:');
    console.log('   Set these in Vercel dashboard or CLI:\n');

    analysis.envAdvice.required.forEach(envVar => {
      console.log(`   vercel env add ${envVar} production`);
    });

    if (analysis.envAdvice.notes) {
      console.log(`\n   📝 ${analysis.envAdvice.notes}`);
    }
  }

  console.log('\n✨ Auto-fix complete!\n');
  process.exit(finalStatus === 'success' ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
