import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('Checking database structure...\n');

    // Check if customers table exists
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('customers', 'quotes')
      ORDER BY table_name
    `;

    console.log('Tables found:', tablesResult);

    // Check quotes table columns
    const quotesColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'quotes'
      ORDER BY ordinal_position
    `;

    console.log('\nQuotes table columns:');
    quotesColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if customers table exists and its columns
    const customersColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `;

    if (customersColumns.length > 0) {
      console.log('\nCustomers table columns:');
      customersColumns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('\n❌ Customers table does NOT exist!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
