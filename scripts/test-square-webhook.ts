#!/usr/bin/env tsx

/**
 * Square Webhook Testing Utility
 * 
 * This script helps test the Square webhook endpoint locally and in production.
 * It generates sample webhook payloads and can send them to your endpoint.
 */

import { createHmac } from 'crypto';

// Sample webhook payloads for different events
const SAMPLE_PAYMENT_CREATED = {
  merchant_id: "MLCQJ1VFPXP64",
  location_id: "LMK858A133EV3",
  event_id: "test-event-" + Date.now(),
  created_at: new Date().toISOString(),
  type: "payment.created",
  data: {
    type: "payment",
    id: "test-payment-" + Date.now(),
    object: {
      payment: {
        id: "test-payment-" + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        amount_money: {
          amount: 150000, // $1,500.00 in cents
          currency: "USD"
        },
        status: "PENDING",
        source_type: "CARD",
        location_id: "LMK858A133EV3",
        reference_id: "Q-2024-001", // Quote number
        buyer_email_address: "customer@example.com",
        note: "Quote Q-2024-001 - John Smith",
        receipt_number: "test-receipt-" + Date.now(),
        receipt_url: "https://squareup.com/receipt/test"
      }
    }
  }
};

const SAMPLE_PAYMENT_COMPLETED = {
  ...SAMPLE_PAYMENT_CREATED,
  event_id: "test-event-completed-" + Date.now(),
  type: "payment.updated",
  data: {
    ...SAMPLE_PAYMENT_CREATED.data,
    object: {
      payment: {
        ...SAMPLE_PAYMENT_CREATED.data.object.payment,
        status: "COMPLETED",
        updated_at: new Date().toISOString()
      }
    }
  }
};

const SAMPLE_CHECKOUT_COMPLETED = {
  merchant_id: "MLCQJ1VFPXP64",
  location_id: "LMK858A133EV3",
  event_id: "test-checkout-" + Date.now(),
  created_at: new Date().toISOString(),
  type: "checkout.completed",
  data: {
    type: "order",
    id: "test-order-" + Date.now(),
    object: {
      order: {
        id: "test-order-" + Date.now(),
        location_id: "LMK858A133EV3",
        reference_id: "Q-2024-001",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        state: "COMPLETED",
        version: 1,
        total_money: {
          amount: 150000,
          currency: "USD"
        },
        tenders: [
          {
            id: "test-tender-" + Date.now(),
            type: "CARD",
            amount_money: {
              amount: 150000,
              currency: "USD"
            },
            transaction_id: "test-transaction-" + Date.now()
          }
        ]
      }
    }
  }
};

function generateSignature(payload: string, signatureKey: string): string {
  return createHmac('sha256', signatureKey)
    .update(payload)
    .digest('base64');
}

async function sendWebhook(
  webhookUrl: string, 
  payload: any, 
  signatureKey: string
): Promise<void> {
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, signatureKey);

  console.log('🚀 Sending webhook to:', webhookUrl);
  console.log('📝 Event type:', payload.type);
  console.log('🔐 Signature:', signature);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-square-signature': signature,
        'User-Agent': 'Square/Webhooks'
      },
      body: payloadString
    });

    const responseText = await response.text();
    
    console.log('✅ Response status:', response.status);
    console.log('📄 Response:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    console.log('✅ Webhook sent successfully!');
  } catch (error) {
    console.error('❌ Error sending webhook:', error);
    throw error;
  }
}

async function testWebhookEndpoint() {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/square';
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'test-signature-key';

  console.log('🧪 Testing Square Webhook Endpoint');
  console.log('🌐 URL:', webhookUrl);
  console.log('🔑 Using signature key:', signatureKey.substring(0, 8) + '...');
  console.log('');

  // Test 1: Payment Created
  console.log('--- Test 1: Payment Created ---');
  try {
    await sendWebhook(webhookUrl, SAMPLE_PAYMENT_CREATED, signatureKey);
  } catch (error) {
    console.error('Test 1 failed:', error);
  }
  console.log('');

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Payment Completed
  console.log('--- Test 2: Payment Completed ---');
  try {
    await sendWebhook(webhookUrl, SAMPLE_PAYMENT_COMPLETED, signatureKey);
  } catch (error) {
    console.error('Test 2 failed:', error);
  }
  console.log('');

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Checkout Completed
  console.log('--- Test 3: Checkout Completed ---');
  try {
    await sendWebhook(webhookUrl, SAMPLE_CHECKOUT_COMPLETED, signatureKey);
  } catch (error) {
    console.error('Test 3 failed:', error);
  }
  console.log('');

  console.log('🏁 Webhook testing completed!');
}

async function testSignatureVerification() {
  console.log('🔐 Testing Signature Verification');
  
  const testPayload = JSON.stringify({ test: 'data' });
  const testKey = 'test-signature-key';
  
  const signature1 = generateSignature(testPayload, testKey);
  const signature2 = generateSignature(testPayload, testKey);
  const signature3 = generateSignature(testPayload + 'modified', testKey);
  
  console.log('Original payload signature:', signature1);
  console.log('Same payload signature:', signature2);
  console.log('Modified payload signature:', signature3);
  console.log('Signatures match:', signature1 === signature2);
  console.log('Modified signature different:', signature1 !== signature3);
  console.log('');
}

// Main execution
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      await testWebhookEndpoint();
      break;
    case 'signature':
      await testSignatureVerification();
      break;
    case 'health':
      const healthUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/square';
      console.log('🏥 Health check:', healthUrl);
      try {
        const response = await fetch(healthUrl);
        const result = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', result);
      } catch (error) {
        console.error('Health check failed:', error);
      }
      break;
    default:
      console.log('Square Webhook Testing Utility');
      console.log('');
      console.log('Usage:');
      console.log('  npm run webhook:test      - Send test webhook events');
      console.log('  npm run webhook:signature - Test signature verification');
      console.log('  npm run webhook:health    - Check webhook endpoint health');
      console.log('');
      console.log('Environment Variables:');
      console.log('  WEBHOOK_URL               - Webhook endpoint URL (default: localhost:3000)');
      console.log('  SQUARE_WEBHOOK_SIGNATURE_KEY - Signature key for verification');
      console.log('');
      console.log('Examples:');
      console.log('  WEBHOOK_URL=https://your-app.com/api/webhooks/square npm run webhook:test');
      console.log('  SQUARE_WEBHOOK_SIGNATURE_KEY=your-key npm run webhook:test');
  }
}

if (require.main === module) {
  main().catch(console.error);
}