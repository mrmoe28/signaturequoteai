import { neon } from '@neondatabase/serverless';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vqzMmGf72jkX@ep-floral-butterfly-add12tu0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

  console.log('🔄 Connecting to database...');
  const sql = neon(databaseUrl);

  try {
    console.log('🔄 Running migration: 0009_add_oauth_tables.sql\n');

    // Create accounts table
    console.log('Creating accounts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" text NOT NULL,
        "provider" text NOT NULL,
        "provider_account_id" text NOT NULL,
        "refresh_token" text,
        "access_token" text,
        "expires_at" integer,
        "token_type" text,
        "scope" text,
        "id_token" text,
        "session_state" text
      )
    `;
    console.log('✅ Accounts table created');

    // Create indexes for accounts
    console.log('Creating indexes for accounts...');
    await sql`CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "accounts_provider_idx" ON "accounts" ("provider")`;
    await sql`CREATE INDEX IF NOT EXISTS "accounts_provider_account_idx" ON "accounts" ("provider", "provider_account_id")`;
    console.log('✅ Accounts indexes created');

    // Create verification_tokens table
    console.log('Creating verification_tokens table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "verification_tokens" (
        "identifier" text NOT NULL,
        "token" text NOT NULL UNIQUE,
        "expires" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now()
      )
    `;
    console.log('✅ Verification_tokens table created');

    // Create indexes for verification_tokens
    console.log('Creating indexes for verification_tokens...');
    await sql`CREATE INDEX IF NOT EXISTS "verification_tokens_identifier_token_idx" ON "verification_tokens" ("identifier", "token")`;
    await sql`CREATE INDEX IF NOT EXISTS "verification_tokens_token_idx" ON "verification_tokens" ("token")`;
    console.log('✅ Verification_tokens indexes created');

    console.log('\n✅ Migration completed successfully!');
    console.log('✅ OAuth tables are ready for Google authentication');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
