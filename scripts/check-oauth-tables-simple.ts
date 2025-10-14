import { sql } from '@/lib/db';

async function checkTables() {
  try {
    console.log('🔍 Checking OAuth tables...\n');

    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('accounts', 'sessions', 'verification_tokens', 'users')
      ORDER BY table_name;
    `;

    const existingTables = result.map((r: any) => r.table_name);

    console.log('✅ Found tables:', existingTables);

    const requiredTables = ['accounts', 'sessions', 'verification_tokens', 'users'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:', missingTables);
      console.log('\n⚠️  Need to run migrations!');
    } else {
      console.log('\n✅ All OAuth tables exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTables();
