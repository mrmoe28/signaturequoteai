// Simple database connection test
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function testConnection() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set in environment');
    }

    console.log('🔍 Testing database connection...');
    console.log('📍 Connection string starts with:', process.env.DATABASE_URL.substring(0, 30) + '...');

    const sql = neon(process.env.DATABASE_URL);

    // Test basic query
    const result = await sql`SELECT current_database(), current_user, version()`;

    console.log('✅ Database connection successful!');
    console.log('📊 Database:', result[0].current_database);
    console.log('👤 User:', result[0].current_user);
    console.log('🔧 Version:', result[0].version.split(' ')[0], result[0].version.split(' ')[1]);

    // Check if tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📋 Existing tables:', tables.length > 0 ? tables.map(t => t.table_name).join(', ') : 'No tables yet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
