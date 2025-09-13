#!/usr/bin/env tsx

import { verifyGmailConnectivity, sendQuoteEmailGmail } from '../lib/gmail-service-improved';
import { createLogger } from '../lib/logger';

const logger = createLogger('test-service-account');

async function testServiceAccount() {
  console.log('🔍 Testing service account connectivity...');
  
  try {
    const connectivity = await verifyGmailConnectivity();
    if (connectivity.ok) {
      console.log(`✅ Gmail API accessible. Sender email: ${connectivity.email}`);
    } else {
      console.log(`❌ Gmail API not accessible: ${connectivity.error}`);
      return;
    }

    // Test sending email
    console.log('📧 Testing email sending...');
    try {
      const result = await sendQuoteEmailGmail({
        quoteId: 'test-123',
        quoteNumber: 'TEST-001',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerCompany: 'Test Company',
        total: 1000,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        items: [
          {
            name: 'Test Solar Panel',
            sku: 'SP-001',
            quantity: 2,
            unitPrice: 500,
            extended: 1000
          }
        ]
      });
      console.log('✅ Test email sent successfully:', result.messageId);
    } catch (error) {
      console.log('❌ Test email failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Service account test failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run the test
testServiceAccount().catch(console.error);
