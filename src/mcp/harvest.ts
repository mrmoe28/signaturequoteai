/**
 * Error Harvester - Collect build/test logs and relevant code files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const LOGS_DIR = path.join(process.cwd(), '.mcp/logs');

/**
 * Ensure logs directory exists
 */
async function ensureLogsDir(): Promise<void> {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

/**
 * Run a command and capture stdout/stderr to a log file
 *
 * @param command - Shell command to execute
 * @returns Object with exit code, log file path, and output content
 */
export async function runAndCapture(
  command: string
): Promise<{ exitCode: number; logPath: string; output: string }> {
  await ensureLogsDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(LOGS_DIR, `${timestamp}.log`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const output = `${stdout}\n${stderr}`.trim();
    await fs.writeFile(logPath, output, 'utf-8');

    return { exitCode: 0, logPath, output };
  } catch (error: any) {
    const output = `${error.stdout || ''}\n${error.stderr || ''}`.trim();
    await fs.writeFile(logPath, output, 'utf-8');

    return {
      exitCode: error.code || 1,
      logPath,
      output,
    };
  }
}

/**
 * Read the most recent log file
 *
 * @param maxLines - Maximum lines to return (from end of file)
 * @returns Log content as string
 */
export async function readRecentLog(maxLines: number = 1500): Promise<string | null> {
  await ensureLogsDir();

  const files = await fs.readdir(LOGS_DIR);
  const logFiles = files
    .filter(f => f.endsWith('.log'))
    .sort()
    .reverse();

  if (logFiles.length === 0) {
    return null;
  }

  const latestLog = path.join(LOGS_DIR, logFiles[0]);
  const content = await fs.readFile(latestLog, 'utf-8');
  const lines = content.split('\n');

  return lines.slice(-maxLines).join('\n');
}

/**
 * Read a specific log file
 */
export async function readLog(logPath: string): Promise<string> {
  return await fs.readFile(logPath, 'utf-8');
}

/**
 * Extract file paths mentioned in error logs
 * Looks for patterns like:
 * - src/file.ts:123:45
 * - Error in ./src/file.ts
 * - at /path/to/file.ts
 */
export function extractFilePaths(logs: string): string[] {
  const patterns = [
    /(?:^|\s)([a-zA-Z0-9_\-./]+\.(ts|tsx|js|jsx|json))(?::\d+)?/gm,
    /Error in \.\/([a-zA-Z0-9_\-./]+)/gm,
    /at \/([a-zA-Z0-9_\-./]+)/gm,
  ];

  const paths = new Set<string>();

  patterns.forEach(pattern => {
    const matches = logs.matchAll(pattern);
    for (const match of matches) {
      const filePath = match[1];
      if (filePath && !filePath.includes('node_modules')) {
        paths.add(filePath);
      }
    }
  });

  return Array.from(paths);
}

/**
 * Read file content safely
 */
export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    return await fs.readFile(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Clean old log files (keep last 50)
 */
export async function cleanOldLogs(): Promise<void> {
  const files = await fs.readdir(LOGS_DIR);
  const logFiles = files
    .filter(f => f.endsWith('.log'))
    .sort()
    .reverse();

  const toDelete = logFiles.slice(50);

  await Promise.all(
    toDelete.map(f => fs.unlink(path.join(LOGS_DIR, f)).catch(() => {}))
  );
}

/**
 * Read Claude context from claude.md or .claude.md
 */
export async function readClaudeContext(): Promise<string> {
  const candidates = ['./claude.md', './.claude.md', './CLAUDE.md'];

  for (const candidate of candidates) {
    const content = await readFileSafe(candidate);
    if (content) {
      return content;
    }
  }

  return '';
}

/**
 * Gather critical Vercel deployment files
 */
export async function gatherFiles(customGlobs?: string[]): Promise<Array<{ path: string; content: string }>> {
  const glob = require('fast-glob');

  // Priority files for Vercel deployments
  const priorityFiles = [
    'package.json',
    'vercel.json',
    'next.config.js',
    'next.config.ts',
    'next.config.mjs',
    'tsconfig.json',
    'middleware.ts',
    'middleware.js',
    '.env.example',
    'prisma/schema.prisma',
    'playwright.config.ts',
    'playwright.config.js',
  ];

  // App/Pages Router entry points
  const entryGlobs = [
    'app/layout.{ts,tsx,js,jsx}',
    'app/page.{ts,tsx,js,jsx}',
    'pages/_app.{ts,tsx,js,jsx}',
    'pages/index.{ts,tsx,js,jsx}',
    'app/api/**/route.{ts,js}',
    'pages/api/**/*.{ts,js}',
  ];

  const allGlobs = customGlobs || [...priorityFiles, ...entryGlobs];

  const files: Array<{ path: string; content: string }> = [];
  const maxFiles = 12;
  const maxFileSize = 50000; // 50KB per file

  try {
    const matches = await glob(allGlobs, {
      cwd: process.cwd(),
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
      absolute: false,
    });

    for (const match of matches.slice(0, maxFiles)) {
      const content = await readFileSafe(match);
      if (content && content.length < maxFileSize) {
        files.push({ path: match, content });
      }
    }
  } catch (error) {
    console.warn('Error gathering files:', error);
  }

  return files;
}
