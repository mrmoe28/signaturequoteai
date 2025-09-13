#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { verifyGmailConnectivity, sendQuoteEmailGmail } from '../lib/gmail-service';
import { createLogger } from '../lib/logger';

const logger = createLogger('test-domain-delegation');

async function testDomainDelegation() {
  console.log('🔍 Testing Gmail API with domain-wide delegation...');
  console.log('Service Account:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log('Subject (Gmail Account): ekosolarize@gmail.com');
  console.log('');
  
  try {
    // Test connectivity
    console.log('📡 Testing Gmail API connectivity...');
    const connectivity = await verifyGmailConnectivity();
    
    if (connectivity.ok) {
      console.log('✅ Gmail API accessible!');
      console.log('📧 Sender email:', connectivity.email);
      console.log('');
      
      // Test sending email
      console.log('📧 Testing email sending...');
      const result = await sendQuoteEmailGmail({
        quoteId: 'test-delegation-123',
        quoteNumber: 'DELEGATION-TEST-001',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerCompany: 'Test Company',
        total: 2000,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            name: 'Test Solar Panel',
            sku: 'SP-001',
            quantity: 4,
            unitPrice: 500,
            extended: 2000
          }
        ]
      });
      
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      
    } else {
      console.log('❌ Gmail API not accessible:', connectivity.error);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Ensure domain-wide delegation is set up in Google Workspace Admin');
      console.log('2. Check that the Client ID matches your service account');
      console.log('3. Verify the OAuth scope: https://www.googleapis.com/auth/gmail.send');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    console.log('');
    console.log('🔧 Common issues:');
    console.log('- Domain-wide delegation not configured');
    console.log('- Incorrect Client ID in delegation settings');
    console.log('- Missing Gmail send scope');
  }
}

// Run the test
testDomainDelegation().catch(console.error);
