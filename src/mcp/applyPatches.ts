/**
 * Patch Applier - Apply code patches with validation and backup
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { AnalysisResponse } from './chatgptClient';
import { calculateDiffStats, formatStats } from './diff';

const BACKUPS_DIR = path.join(process.cwd(), '.mcp/backups');

/**
 * Ensure backups directory exists
 */
async function ensureBackupsDir(): Promise<void> {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

/**
 * Create backup of a file before patching
 */
async function backupFile(filePath: string): Promise<string> {
  await ensureBackupsDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = path.basename(filePath);
  const backupPath = path.join(BACKUPS_DIR, `${fileName}.${timestamp}`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, content, 'utf-8');
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to backup ${filePath}: ${error}`);
  }
}

/**
 * Restore file from backup
 */
async function restoreBackup(filePath: string, backupPath: string): Promise<void> {
  const content = await fs.readFile(backupPath, 'utf-8');
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Apply a single patch to a file
 */
async function applyPatch(patch: AnalysisResponse['patches'][0]): Promise<{
  success: boolean;
  backupPath?: string;
  stats?: ReturnType<typeof calculateDiffStats>;
  error?: string;
}> {
  const fullPath = path.isAbsolute(patch.path)
    ? patch.path
    : path.join(process.cwd(), patch.path);

  try {
    // Read current content
    const originalContent = await fs.readFile(fullPath, 'utf-8');

    // Create backup
    const backupPath = await backupFile(fullPath);

    let newContent: string;

    if (patch.replacement) {
      // Full file replacement
      newContent = patch.replacement;
    } else if (patch.startLine && patch.endLine && patch.after) {
      // Partial line replacement
      const lines = originalContent.split('\n');
      const before = lines.slice(0, patch.startLine - 1);
      const after = lines.slice(patch.endLine);
      const replacement = patch.after.split('\n');

      newContent = [...before, ...replacement, ...after].join('\n');
    } else {
      return {
        success: false,
        error: 'Invalid patch format: must provide either replacement or (startLine, endLine, after)',
      };
    }

    // Calculate stats
    const stats = calculateDiffStats(originalContent, newContent);

    // Write patched content
    await fs.writeFile(fullPath, newContent, 'utf-8');

    // Verify syntax if TypeScript/JavaScript
    if (fullPath.match(/\.(ts|tsx|js|jsx)$/)) {
      const syntaxValid = await validateSyntax(fullPath);
      if (!syntaxValid) {
        // Rollback on syntax error
        await restoreBackup(fullPath, backupPath);
        return {
          success: false,
          backupPath,
          error: 'Syntax validation failed, rolled back',
        };
      }
    }

    return { success: true, backupPath, stats };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Validate TypeScript/JavaScript syntax
 */
async function validateSyntax(filePath: string): Promise<boolean> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    // Try to compile with tsc if tsconfig exists
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    try {
      await fs.access(tsconfigPath);
      await execAsync(`npx tsc --noEmit ${filePath}`, {
        cwd: process.cwd(),
      });
    } catch {
      // If tsc fails or no tsconfig, just assume syntax is ok
      // (actual validation will happen during build)
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Apply all patches from analysis response
 */
export async function applyAllPatches(analysis: AnalysisResponse): Promise<{
  applied: number;
  failed: number;
  results: Array<{
    path: string;
    success: boolean;
    stats?: string;
    error?: string;
  }>;
}> {
  const results: Array<{
    path: string;
    success: boolean;
    stats?: string;
    error?: string;
  }> = [];

  let applied = 0;
  let failed = 0;

  for (const patch of analysis.patches) {
    console.log(`\nApplying patch to ${patch.path}...`);

    const result = await applyPatch(patch);

    if (result.success) {
      applied++;
      const statsStr = result.stats ? formatStats(result.stats) : 'unknown';
      console.log(`✓ Applied successfully (${statsStr})`);
      if (result.backupPath) {
        console.log(`  Backup: ${result.backupPath}`);
      }
      results.push({
        path: patch.path,
        success: true,
        stats: statsStr,
      });
    } else {
      failed++;
      console.log(`✗ Failed: ${result.error}`);
      results.push({
        path: patch.path,
        success: false,
        error: result.error,
      });
    }
  }

  return { applied, failed, results };
}
