import { neon } from '@neondatabase/serverless';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  const sql = neon(databaseUrl);

  try {
    console.log('🔄 Running migration: 0008_add_password_reset_tokens.sql');

    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" text NOT NULL UNIQUE,
        "expires" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "used" text DEFAULT 'false' NOT NULL
      )
    `;

    console.log('✅ Table created');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" ("user_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens" ("token")`;

    console.log('✅ Indexes created');
    console.log('✅ Migration completed successfully!');
    console.log('✅ password_reset_tokens table is ready');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
