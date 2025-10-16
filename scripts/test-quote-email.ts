#!/usr/bin/env tsx
/**
 * Test Quote Email with Square Payment Link
 *
 * This script sends a test quote email with:
 * - Gmail SMTP
 * - Square payment link
 * - PDF attachment
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { sendQuoteEmail, EmailQuoteData } from '../lib/email';
import { createLogger } from '../lib/logger';

const logger = createLogger('test-quote-email');

async function main() {
  console.log('\n🧪 Testing Quote Email with Square Payment Link\n');
  console.log('='.repeat(60));

  // Test data
  const testEmail = process.env.GOOGLE_CLIENT_EMAIL || 'test@example.com';

  const emailData: EmailQuoteData = {
    quoteId: 'test-' + Date.now(),
    quoteNumber: 'TEST-' + Math.floor(Math.random() * 10000),
    customerName: 'Test Customer',
    customerEmail: testEmail, // Send to your own email for testing
    customerCompany: 'Test Company LLC',
    total: 1299.99,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    items: [
      {
        name: 'Emporia EV Charger | Black | NEMA 14-50 | J1772',
        quantity: 2,
        unitPrice: 429.00,
        extended: 858.00,
        imageUrl: 'https://signaturesolar.com/wp-content/uploads/2024/01/Emporia-EV-Charger-Black-NEMA-14-50-J1772-300x300.png'
      },
      {
        name: 'EG4 18kPV Hybrid Inverter | 48V 18000W Output | 14400W PV Input',
        quantity: 1,
        unitPrice: 441.99,
        extended: 441.99,
        imageUrl: 'https://signaturesolar.com/wp-content/uploads/2023/01/EG4-18kPV-Hybrid-Inverter-48V-18000W-Output-14400W-PV-Input-300x300.png'
      }
    ],
    // Note: No userId means it will use app-level Square credentials
  };

  console.log('📧 Recipient:', testEmail);
  console.log('💰 Total:', `$${emailData.total.toFixed(2)}`);
  console.log('📦 Items:', emailData.items.length);
  console.log('\n' + '='.repeat(60));

  try {
    console.log('\n⏳ Sending email...\n');

    const result = await sendQuoteEmail(emailData);

    console.log('✅ Email sent successfully!');
    console.log('\n📊 Result:');
    console.log('  - Message ID:', result.messageId);
    console.log('  - Status:', result.success ? 'Success' : 'Failed');
    if (result.message) {
      console.log('  - Message:', result.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test completed successfully!');
    console.log('\n📬 Check your email:', testEmail);
    console.log('   - Look for the Square payment link in the email');
    console.log('   - Verify the PDF attachment');
    console.log('   - Click the payment link to test Square checkout');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Test failed');
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');

    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }

    console.log('\n' + '='.repeat(60));
    console.log('💡 Troubleshooting:');
    console.log('  1. Check environment variables are loaded correctly');
    console.log('  2. Verify Gmail SMTP credentials are valid');
    console.log('  3. Verify Square credentials are configured');
    console.log('  4. Check server logs for more details');
    console.log('='.repeat(60) + '\n');

    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
