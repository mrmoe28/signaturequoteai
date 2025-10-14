/**
 * Simple unified diff generator
 * Creates git-style diffs for display purposes
 */

export interface DiffStats {
  additions: number;
  deletions: number;
  changes: number;
}

/**
 * Calculate diff statistics
 */
export function calculateDiffStats(before: string, after: string): DiffStats {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');

  let additions = 0;
  let deletions = 0;

  // Simple line-by-line comparison
  const maxLen = Math.max(beforeLines.length, afterLines.length);
  for (let i = 0; i < maxLen; i++) {
    const beforeLine = beforeLines[i];
    const afterLine = afterLines[i];

    if (beforeLine === undefined) {
      additions++;
    } else if (afterLine === undefined) {
      deletions++;
    } else if (beforeLine !== afterLine) {
      additions++;
      deletions++;
    }
  }

  return {
    additions,
    deletions,
    changes: Math.max(additions, deletions),
  };
}

/**
 * Generate a simple unified diff string
 */
export function generateDiff(
  filePath: string,
  before: string,
  after: string
): string {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const stats = calculateDiffStats(before, after);

  const lines: string[] = [
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
  ];

  // Simple line-by-line diff (not optimal, but works)
  for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
    const beforeLine = beforeLines[i];
    const afterLine = afterLines[i];

    if (beforeLine === undefined) {
      lines.push(`+${afterLine}`);
    } else if (afterLine === undefined) {
      lines.push(`-${beforeLine}`);
    } else if (beforeLine !== afterLine) {
      lines.push(`-${beforeLine}`);
      lines.push(`+${afterLine}`);
    } else {
      lines.push(` ${beforeLine}`);
    }
  }

  return lines.join('\n') + `\n\n(+${stats.additions} -${stats.deletions})`;
}

/**
 * Format diff stats for display
 */
export function formatStats(stats: DiffStats): string {
  return `+${stats.additions} -${stats.deletions}`;
}
