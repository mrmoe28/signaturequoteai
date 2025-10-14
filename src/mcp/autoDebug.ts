#!/usr/bin/env tsx
/**
 * Auto-Debug Chain - One-command error analysis and fix loop
 *
 * Usage:
 *   tsx src/mcp/autoDebug.ts --cmd "npm run build" --title "Build error"
 *   tsx src/mcp/autoDebug.ts --cmd "npm test" --title "Test failure" --files "src/**\/*.ts"
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import fg from 'fast-glob';
import { analyzeError } from './chatgptClient';
import { runAndCapture, extractFilePaths, readFileSafe, cleanOldLogs } from './harvest';
import { applyAllPatches } from './applyPatches';

interface Args {
  cmd: string;
  title: string;
  question?: string;
  files?: string;
  maxIterations?: number;
}

const REPORTS_DIR = path.join(process.cwd(), '.mcp/reports');

/**
 * Parse command line arguments
 */
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Partial<Args> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (key === 'cmd' || key === 'title' || key === 'question' || key === 'files') {
        result[key] = value;
        i++;
      } else if (key === 'maxIterations') {
        result.maxIterations = parseInt(value, 10);
        i++;
      }
    }
  }

  if (!result.cmd || !result.title) {
    console.error('Usage: tsx src/mcp/autoDebug.ts --cmd "<command>" --title "<title>" [--files "glob"] [--question "text"]');
    process.exit(1);
  }

  return result as Args;
}

/**
 * Collect code files for context
 */
async function collectFiles(globPatterns: string[], extractedPaths: string[]): Promise<Array<{ path: string; content: string }>> {
  const MAX_FILES = 8;
  const MAX_FILE_SIZE = 50000; // 50KB per file

  // Combine glob patterns and extracted paths
  const allPaths = new Set<string>();

  // Add files from glob patterns
  for (const pattern of globPatterns) {
    const matches = await fg(pattern, {
      cwd: process.cwd(),
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
    });
    matches.forEach(p => allPaths.add(p));
  }

  // Add files extracted from error logs
  extractedPaths.forEach(p => allPaths.add(p));

  // If no files found, add some default entrypoints
  if (allPaths.size === 0) {
    const defaults = [
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'pages/index.tsx',
      'app/page.tsx',
      'next.config.js',
      'next.config.ts',
    ];
    for (const def of defaults) {
      const content = await readFileSafe(def);
      if (content) allPaths.add(def);
    }
  }

  // Read file contents
  const files: Array<{ path: string; content: string }> = [];

  for (const filePath of Array.from(allPaths).slice(0, MAX_FILES)) {
    const content = await readFileSafe(filePath);
    if (content && content.length <= MAX_FILE_SIZE) {
      files.push({ path: filePath, content });
    }
  }

  return files;
}

/**
 * Generate markdown report
 */
async function generateReport(
  title: string,
  iterations: Array<{
    iteration: number;
    command: string;
    exitCode: number;
    logs: string;
    analysis?: any;
    patchResults?: any;
  }>
): Promise<string> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORTS_DIR, `${timestamp}.md`);

  const lines = [
    `# Auto-Debug Report: ${title}`,
    `\nGenerated: ${new Date().toISOString()}`,
    `\nTotal Iterations: ${iterations.length}`,
    '',
  ];

  iterations.forEach(iter => {
    lines.push(`## Iteration ${iter.iteration}`);
    lines.push(`\n**Command**: \`${iter.command}\``);
    lines.push(`**Exit Code**: ${iter.exitCode}`);

    if (iter.analysis) {
      lines.push(`\n### Analysis`);
      lines.push(`**Summary**: ${iter.analysis.summary}`);
      lines.push(`**Root Cause**: ${iter.analysis.rootCause}`);
      lines.push(`**Fix Plan**:\n${iter.analysis.fixPlan}`);
    }

    if (iter.patchResults) {
      lines.push(`\n### Patch Results`);
      lines.push(`Applied: ${iter.patchResults.applied}`);
      lines.push(`Failed: ${iter.patchResults.failed}`);
      iter.patchResults.results.forEach((r: any) => {
        const status = r.success ? '✓' : '✗';
        lines.push(`- ${status} ${r.path} ${r.stats || r.error || ''}`);
      });
    }

    lines.push(`\n### Logs\n\`\`\`\n${iter.logs.slice(-2000)}\n\`\`\``);
    lines.push('\n---\n');
  });

  const content = lines.join('\n');
  await fs.writeFile(reportPath, content, 'utf-8');

  return reportPath;
}

/**
 * Main auto-debug loop
 */
async function main() {
  const args = parseArgs();
  const maxIterations = args.maxIterations || 3;
  const fileGlobs = args.files ? args.files.split(',') : ['src/**/*.{ts,tsx,js,jsx}'];

  console.log(`\n🔍 Auto-Debug Chain Starting`);
  console.log(`Command: ${args.cmd}`);
  console.log(`Title: ${args.title}`);
  console.log(`Max Iterations: ${maxIterations}\n`);

  const iterations: Array<{
    iteration: number;
    command: string;
    exitCode: number;
    logs: string;
    analysis?: any;
    patchResults?: any;
  }> = [];

  for (let i = 1; i <= maxIterations; i++) {
    console.log(`\n━━━ Iteration ${i}/${maxIterations} ━━━\n`);

    // Run command and capture output
    console.log(`Running: ${args.cmd}...`);
    const result = await runAndCapture(args.cmd);

    console.log(`Exit code: ${result.exitCode}`);

    if (result.exitCode === 0) {
      console.log('\n✓ No errors detected! Command succeeded.');
      iterations.push({
        iteration: i,
        command: args.cmd,
        exitCode: 0,
        logs: result.output,
      });
      break;
    }

    // Extract file paths from logs
    const extractedPaths = extractFilePaths(result.output);
    console.log(`\nExtracted ${extractedPaths.length} file paths from logs`);

    // Collect code context
    console.log('Collecting code files for context...');
    const files = await collectFiles(fileGlobs, extractedPaths);
    console.log(`Collected ${files.length} files (max 8)`);

    // Analyze error with ChatGPT
    console.log('\n🤖 Analyzing error with ChatGPT...');
    const analysis = await analyzeError({
      title: args.title,
      logs: result.output.slice(-1500), // Last 1500 lines
      files,
      question: args.question,
    });

    console.log(`\n📋 Analysis Complete`);
    console.log(`Summary: ${analysis.summary}`);
    console.log(`Root Cause: ${analysis.rootCause}`);
    console.log(`Fix Plan:\n${analysis.fixPlan}`);

    // Apply patches
    if (analysis.patches.length > 0) {
      console.log(`\n🔧 Applying ${analysis.patches.length} patches...`);
      const patchResults = await applyAllPatches(analysis);

      iterations.push({
        iteration: i,
        command: args.cmd,
        exitCode: result.exitCode,
        logs: result.output,
        analysis,
        patchResults,
      });

      if (patchResults.failed > 0) {
        console.log(`\n⚠️  ${patchResults.failed} patches failed, stopping iteration.`);
        break;
      }
    } else {
      console.log('\nNo patches to apply.');
      iterations.push({
        iteration: i,
        command: args.cmd,
        exitCode: result.exitCode,
        logs: result.output,
        analysis,
      });
      break;
    }
  }

  // Generate report
  console.log('\n📄 Generating report...');
  const reportPath = await generateReport(args.title, iterations);
  console.log(`Report saved: ${reportPath}`);

  // Clean old logs
  await cleanOldLogs();

  // Final summary
  const lastIteration = iterations[iterations.length - 1];
  if (lastIteration.exitCode === 0) {
    console.log('\n✅ Success! Issue resolved.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Issue not fully resolved. Check the report for details.');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}
