import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Check if we're in a build context
function isBuildTime(): boolean {
  // During Next.js build, this environment variable is not set
  return process.env.NEXT_PHASE === 'phase-production-build' ||
         process.env.NEXT_PHASE === 'phase-export';
}

// Get database URL with validation
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  // During build time, return a placeholder to prevent errors
  if (isBuildTime() && (!databaseUrl || databaseUrl === 'your_database_url_here')) {
    // Return a valid-looking URL to pass validation during build
    // This won't actually be used since routes with database access should be dynamic
    return 'postgresql://placeholder:placeholder@placeholder/placeholder';
  }

  if (!databaseUrl || databaseUrl === 'your_database_url_here') {
    throw new Error(
      'DATABASE_URL is not configured. Please set DATABASE_URL in your .env.local file'
    );
  }

  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  return databaseUrl;
}

// Lazy initialization - only connect when actually used
let _sql: ReturnType<typeof neon> | undefined;
let _db: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (!_db) {
    const url = getDatabaseUrl();
    _sql = neon(url);
    _db = drizzle(_sql, { schema });
  }
  return _db;
}

export function getSql() {
  if (!_sql) {
    const url = getDatabaseUrl();
    _sql = neon(url);
  }
  return _sql;
}

// Export with lazy initialization via getter
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});

// Export sql with Proxy to handle tagged template literals
export const sql = new Proxy((() => {}) as unknown as ReturnType<typeof neon>, {
  apply(_target, _thisArg, args) {
    return getSql()(...(args as [TemplateStringsArray, ...any[]]));
  },
  get(_target, prop) {
    const sqlFn = getSql();
    const value = sqlFn[prop as keyof typeof sqlFn];
    return typeof value === 'function' ? value.bind(sqlFn) : value;
  }
});

export * from './schema';