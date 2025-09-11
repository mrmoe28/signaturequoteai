require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testQuoteInsert() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Testing quote insert...');
    
    // First, let's check the table structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'quote_items' 
      ORDER BY ordinal_position;
    `;
    
    console.log('quote_items table structure:');
    console.table(tableInfo);
    
    // Test a simple insert
    const testQuoteId = crypto.randomUUID();
    
    const result = await sql`
      INSERT INTO quote_items (quote_id, product_id, name, unit_price, quantity, extended, notes, image_url)
      VALUES (${testQuoteId}, 'test', 'Test Product', '100.00', '1.00', '100.00', null, null)
      RETURNING *;
    `;
    
    console.log('Insert successful:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testQuoteInsert();
