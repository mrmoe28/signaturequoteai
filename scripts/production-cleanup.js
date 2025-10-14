require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function productionCleanup() {
  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🧹 Starting production cleanup...');

    // Remove demo users (keeping only real admin account)
    console.log('👤 Removing demo users...');
    const demoUsersDeleted = await sql`
      DELETE FROM users 
      WHERE email IN (
        'demo@signaturequotecrawler.com',
        'test@example.com',
        'user@example.com'
      )
    `;
    console.log(`✅ Removed ${demoUsersDeleted.length} demo users`);

    // Clear all existing quotes (demo data)
    console.log('📄 Clearing demo quotes...');
    await sql`DELETE FROM quote_items`;
    const quotesDeleted = await sql`DELETE FROM quotes`;
    console.log(`✅ Removed ${quotesDeleted.length} demo quotes`);

    // Clear all existing products (demo data)
    console.log('📦 Clearing demo products...');
    await sql`DELETE FROM price_snapshots`;
    const productsDeleted = await sql`DELETE FROM products`;
    console.log(`✅ Removed ${productsDeleted.length} demo products`);

    // Clear crawl jobs
    console.log('🕷️ Clearing crawl job history...');
    const crawlJobsDeleted = await sql`DELETE FROM crawl_jobs`;
    console.log(`✅ Removed ${crawlJobsDeleted.length} crawl jobs`);

    // Clear all sessions (force re-login)
    console.log('🔐 Clearing all sessions...');
    const sessionsDeleted = await sql`DELETE FROM sessions`;
    console.log(`✅ Removed ${sessionsDeleted.length} sessions`);

    // Reset company settings to production defaults
    console.log('🏢 Updating company settings for production...');
    await sql`DELETE FROM company_settings`;
    
    const companyResult = await sql`
      INSERT INTO company_settings (
        company_name,
        company_email,
        default_terms,
        default_lead_time,
        quote_prefix
      ) VALUES (
        'Your Company Name',
        'quotes@yourcompany.com',
        'Payment terms: Net 30 days. Prices valid for 30 days from quote date.',
        'Typical lead time 1–2 weeks',
        'Q'
      ) RETURNING id
    `;
    console.log(`✅ Reset company settings (ID: ${companyResult[0].id})`);

    // Show current database state
    console.log('\n📊 Current database state:');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const productCount = await sql`SELECT COUNT(*) as count FROM products`;
    const quoteCount = await sql`SELECT COUNT(*) as count FROM quotes`;
    
    console.log(`👥 Users: ${userCount[0].count}`);
    console.log(`📦 Products: ${productCount[0].count}`);
    console.log(`📄 Quotes: ${quoteCount[0].count}`);

    // List remaining users
    const remainingUsers = await sql`
      SELECT email, role, created_at 
      FROM users 
      ORDER BY created_at
    `;
    
    console.log('\n👥 Remaining users:');
    remainingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Production cleanup failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  productionCleanup()
    .then(() => {
      console.log('\n🎉 Production cleanup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('  1. Update company settings in the app');
      console.log('  2. Run your first product crawl');
      console.log('  3. Change admin password');
      console.log('  4. Update environment variables for production');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Production cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { productionCleanup };