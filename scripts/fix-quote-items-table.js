require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function fixQuoteItemsTable() {
  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Fixing quote_items table...');

    // Check if image_url column exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quote_items' 
      AND column_name = 'image_url'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ image_url column already exists');
      return;
    }

    // Add image_url column
    await sql`ALTER TABLE "quote_items" ADD COLUMN "image_url" text`;
    console.log('✅ Added image_url column to quote_items table');

  } catch (error) {
    console.error('❌ Failed to fix quote_items table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixQuoteItemsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { fixQuoteItemsTable };
