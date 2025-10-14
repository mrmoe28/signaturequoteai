import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(DATABASE_URL);

async function addShipToColumn() {
  try {
    console.log('Adding ship_to column to quotes table...');

    await sql`
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS ship_to TEXT
    `;

    console.log('✅ Column added successfully!');

    // Verify it was added
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'quotes' AND column_name = 'ship_to'
    `;

    if (columns.length > 0) {
      console.log('✅ Verified: ship_to column exists');
    } else {
      console.log('⚠️  Warning: ship_to column not found after adding');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addShipToColumn();
