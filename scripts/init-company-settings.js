require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function initCompanySettings() {
  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Initializing company settings...');

    // Check if company settings already exist
    const existing = await sql`SELECT id FROM company_settings LIMIT 1`;
    
    if (existing.length > 0) {
      console.log('Company settings already exist, skipping initialization.');
      return;
    }

    // Insert default company settings
    const result = await sql`
      INSERT INTO company_settings (
        company_name,
        company_logo,
        company_address,
        company_city,
        company_state,
        company_zip,
        company_phone,
        company_email,
        company_website,
        default_terms,
        default_lead_time,
        quote_prefix
      ) VALUES (
        'Signature QuoteCrawler',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'quotes@signaturequotecrawler.com',
        NULL,
        'Payment terms: Net 30 days. Prices valid for 30 days from quote date.',
        'Typical lead time 1–2 weeks',
        'Q'
      ) RETURNING id
    `;

    console.log('✅ Company settings initialized successfully!');
    console.log('Company ID:', result[0].id);

  } catch (error) {
    console.error('❌ Failed to initialize company settings:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initCompanySettings()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { initCompanySettings };
