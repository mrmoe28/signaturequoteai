import { neon } from '@neondatabase/serverless';

async function verifyTable() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    // Check if table exists
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'password_reset_tokens'
    `;

    if (result.length > 0) {
      console.log('✅ password_reset_tokens table exists');

      // Check columns
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'password_reset_tokens'
        ORDER BY ordinal_position
      `;

      console.log('\n📊 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Check indexes
      const indexes = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'password_reset_tokens'
      `;

      console.log('\n📑 Indexes:');
      indexes.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });

      console.log('\n✅ Verification complete - table is ready!');
    } else {
      console.log('❌ Table does not exist');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyTable();
