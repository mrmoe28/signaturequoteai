import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function verifyOAuthTables() {
  console.log('🔍 Checking for NextAuth OAuth tables...\n');

  try {
    // Check for accounts table
    const accountsCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'accounts'
      );
    `;
    console.log('✓ accounts table:', accountsCheck[0].exists ? '✅ EXISTS' : '❌ MISSING');

    // Check for sessions table
    const sessionsCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
      );
    `;
    console.log('✓ sessions table:', sessionsCheck[0].exists ? '✅ EXISTS' : '❌ MISSING');

    // Check for verification_tokens table
    const tokensCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'verification_tokens'
      );
    `;
    console.log('✓ verification_tokens table:', tokensCheck[0].exists ? '✅ EXISTS' : '❌ MISSING');

    // Check for users table
    const usersCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `;
    console.log('✓ users table:', usersCheck[0].exists ? '✅ EXISTS' : '❌ MISSING');

    console.log('\n📊 All NextAuth tables checked!');

    // If any table is missing, we need to run migrations
    if (!accountsCheck[0].exists || !sessionsCheck[0].exists || !tokensCheck[0].exists) {
      console.log('\n⚠️  Some OAuth tables are missing. Run migrations to create them.');
      process.exit(1);
    }

    console.log('\n✅ All OAuth tables exist!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
}

verifyOAuthTables();
