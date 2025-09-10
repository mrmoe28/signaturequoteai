const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

async function fixDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Check if image_url column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quote_items' 
      AND column_name = 'image_url'
    `;
    
    const result = await pool.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      console.log('Adding image_url column to quote_items table...');
      
      const addColumnQuery = `
        ALTER TABLE "quote_items" ADD COLUMN "image_url" text;
      `;
      
      await pool.query(addColumnQuery);
      console.log('✅ image_url column added successfully!');
    } else {
      console.log('✅ image_url column already exists');
    }
    
    // Check if primary_image_url column exists in products table
    const checkProductColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'primary_image_url'
    `;
    
    const productResult = await pool.query(checkProductColumnQuery);
    
    if (productResult.rows.length === 0) {
      console.log('Adding primary_image_url column to products table...');
      
      const addProductColumnQuery = `
        ALTER TABLE "products" ADD COLUMN "primary_image_url" text;
      `;
      
      await pool.query(addProductColumnQuery);
      console.log('✅ primary_image_url column added successfully!');
    } else {
      console.log('✅ primary_image_url column already exists');
    }
    
    console.log('Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
  } finally {
    await pool.end();
  }
}

fixDatabase();
