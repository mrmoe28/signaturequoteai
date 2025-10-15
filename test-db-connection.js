#!/usr/bin/env node

/**
 * Database Connection Test Script
 *
 * Verifies Neon database connectivity before running the app.
 * Run with: node test-db-connection.js
 *
 * This script helps diagnose database connection issues by:
 * 1. Checking if DATABASE_URL exists and is valid
 * 2. Testing actual database connectivity
 * 3. Listing current user and available tables
 * 4. Providing clear error messages for common issues
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testDatabaseConnection() {
  logSection('🔍 Database Connection Test');

  // Step 1: Check if DATABASE_URL exists
  log('\n📋 Step 1: Checking DATABASE_URL environment variable...', 'bright');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    log('❌ ERROR: DATABASE_URL is not set!', 'red');
    log('\n💡 To fix this:', 'yellow');
    log('   1. Create a .env.local file in your project root', 'yellow');
    log('   2. Add: DATABASE_URL=your_neon_connection_string', 'yellow');
    log('   3. Get your connection string from: https://console.neon.tech', 'yellow');
    process.exit(1);
  }

  // Check for placeholder string
  if (databaseUrl.includes('placeholder') || databaseUrl.includes('YOUR_') || databaseUrl.includes('your-project')) {
    log('❌ ERROR: DATABASE_URL appears to be a placeholder!', 'red');
    log(`   Current value: ${databaseUrl.substring(0, 50)}...`, 'yellow');
    log('\n💡 To fix this:', 'yellow');
    log('   1. Go to https://console.neon.tech', 'yellow');
    log('   2. Copy your actual connection string', 'yellow');
    log('   3. Replace the placeholder in .env.local', 'yellow');
    process.exit(1);
  }

  // Mask password for display
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  log(`✅ DATABASE_URL is set: ${maskedUrl}`, 'green');

  // Step 2: Parse connection string
  log('\n📋 Step 2: Parsing connection details...', 'bright');

  try {
    const url = new URL(databaseUrl);
    log(`   Host: ${url.hostname}`, 'cyan');
    log(`   Port: ${url.port || '5432'}`, 'cyan');
    log(`   Database: ${url.pathname.slice(1)}`, 'cyan');
    log(`   User: ${url.username}`, 'cyan');
    log(`   SSL: ${url.searchParams.get('sslmode') || 'enabled'}`, 'cyan');
  } catch (error) {
    log('❌ ERROR: Invalid DATABASE_URL format!', 'red');
    log(`   ${error.message}`, 'yellow');
    log('\n💡 Expected format:', 'yellow');
    log('   postgresql://user:password@host:port/database?sslmode=require', 'yellow');
    process.exit(1);
  }

  // Step 3: Test database connectivity
  log('\n📋 Step 3: Testing database connection...', 'bright');

  let sql;
  try {
    sql = neon(databaseUrl);
    log('   Connection object created successfully', 'green');
  } catch (error) {
    log('❌ ERROR: Failed to create connection!', 'red');
    log(`   ${error.message}`, 'yellow');
    process.exit(1);
  }

  // Step 4: Test query execution
  log('\n📋 Step 4: Executing test query...', 'bright');

  try {
    const result = await sql`SELECT current_user, current_database(), version()`;

    if (result && result.length > 0) {
      log('✅ Successfully connected to database!', 'green');
      log(`   Current User: ${result[0].current_user}`, 'cyan');
      log(`   Current Database: ${result[0].current_database}`, 'cyan');
      log(`   PostgreSQL Version: ${result[0].version.split(' ').slice(0, 2).join(' ')}`, 'cyan');
    }
  } catch (error) {
    log('❌ ERROR: Failed to execute query!', 'red');
    log(`   ${error.message}`, 'yellow');
    log('\n💡 Common causes:', 'yellow');
    log('   - Database credentials are incorrect', 'yellow');
    log('   - Database server is not accessible', 'yellow');
    log('   - Firewall blocking connections', 'yellow');
    log('   - SSL/TLS certificate issues', 'yellow');
    log('\n💡 Troubleshooting steps:', 'yellow');
    log('   1. Verify your Neon project is active at console.neon.tech', 'yellow');
    log('   2. Check if your IP is allowed (Neon allows all by default)', 'yellow');
    log('   3. Regenerate your connection string if needed', 'yellow');
    process.exit(1);
  }

  // Step 5: List available tables
  log('\n📋 Step 5: Checking database schema...', 'bright');

  try {
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      log('⚠️  WARNING: No tables found in database!', 'yellow');
      log('   Your database is empty. You need to run migrations.', 'yellow');
      log('\n💡 To create tables:', 'yellow');
      log('   Run: npm run db:push', 'yellow');
      log('   Or: npx drizzle-kit push', 'yellow');
    } else {
      log(`✅ Found ${tables.length} table(s):`, 'green');
      tables.forEach(table => {
        const icon = table.table_type === 'VIEW' ? '👁️ ' : '📊';
        log(`   ${icon} ${table.table_name}`, 'cyan');
      });
    }
  } catch (error) {
    log('⚠️  WARNING: Could not list tables', 'yellow');
    log(`   ${error.message}`, 'yellow');
  }

  // Step 6: Check for required tables
  log('\n📋 Step 6: Verifying required tables...', 'bright');

  const requiredTables = [
    'users',
    'customers',
    'products',
    'quotes',
    'quote_items',
    'crawl_jobs'
  ];

  try {
    const existingTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(${requiredTables})
    `;

    const existingTableNames = existingTables.map(t => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));

    if (missingTables.length === 0) {
      log('✅ All required tables exist!', 'green');
    } else {
      log(`⚠️  WARNING: Missing ${missingTables.length} required table(s):`, 'yellow');
      missingTables.forEach(table => {
        log(`   ❌ ${table}`, 'red');
      });
      log('\n💡 To create missing tables:', 'yellow');
      log('   Run: npm run db:push', 'yellow');
      log('   Or: npx drizzle-kit push', 'yellow');
    }
  } catch (error) {
    log('⚠️  WARNING: Could not verify tables', 'yellow');
    log(`   ${error.message}`, 'yellow');
  }

  // Step 7: Test record counts
  log('\n📋 Step 7: Checking data in tables...', 'bright');

  try {
    const counts = [];

    for (const table of requiredTables) {
      try {
        const result = await sql`SELECT COUNT(*)::int as count FROM ${sql(table)}`;
        counts.push({ table, count: result[0].count });
      } catch (err) {
        // Table might not exist, skip
      }
    }

    if (counts.length > 0) {
      counts.forEach(({ table, count }) => {
        const icon = count > 0 ? '📊' : '📭';
        const color = count > 0 ? 'green' : 'yellow';
        log(`   ${icon} ${table}: ${count} record(s)`, color);
      });
    }
  } catch (error) {
    log('⚠️  Could not check record counts', 'yellow');
  }

  // Summary
  logSection('✅ Connection Test Complete!');
  log('\n🎉 Your database connection is working correctly!', 'green');
  log('   You can now safely run your application.', 'green');
  log('\n📝 Next steps:', 'cyan');
  log('   1. If tables are missing, run: npm run db:push', 'cyan');
  log('   2. Start your dev server: npm run dev', 'cyan');
  log('   3. Visit: http://localhost:3000', 'cyan');
  log('   4. Check the dashboard for your data', 'cyan');
  console.log('');
}

// Run the test
testDatabaseConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log('\n❌ Unexpected error:', 'red');
    log(`   ${error.message}`, 'yellow');
    if (error.stack) {
      log('\n📋 Stack trace:', 'yellow');
      console.error(error.stack);
    }
    process.exit(1);
  });
