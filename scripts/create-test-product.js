require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function createTestProduct() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Creating test product...');
    
    const result = await sql`
      INSERT INTO products (id, name, sku, vendor, category, unit, price, currency, url, is_active)
      VALUES ('test-product-123', 'Test Product', 'TEST-123', 'Test Vendor', 'Test Category', 'ea', 100.00, 'USD', 'https://example.com', 'true')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        sku = EXCLUDED.sku,
        vendor = EXCLUDED.vendor,
        category = EXCLUDED.category,
        unit = EXCLUDED.unit,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        url = EXCLUDED.url,
        is_active = EXCLUDED.is_active
      RETURNING *;
    `;
    
    console.log('Test product created:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestProduct();
