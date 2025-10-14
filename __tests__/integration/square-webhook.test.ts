// @ts-nocheck - Jest test file with database queries
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { createHmac } from 'crypto';
import { db, sql } from '@/lib/db';

/**
 * Integration tests for Square Webhook Handler
 *
 * Tests the complete webhook flow including:
 * - Signature verification
 * - Payment event processing
 * - Database updates
 * - Error scenarios
 *
 * Based on best practices from:
 * - Webhook security (HMAC signature verification)
 * - Idempotency handling
 * - Error recovery patterns
 */

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/square`
  : 'http://localhost:3000/api/webhooks/square';

const TEST_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'test-signature-key';

// Helper function to generate valid Square webhook signature
function generateSquareSignature(body: string, signatureKey: string): string {
  return createHmac('sha256', signatureKey)
    .update(body)
    .digest('base64');
}

// Helper function to create test quote
async function createTestQuote() {
  const quoteNumber = `TEST-${Date.now()}`;

  const result: any[] = await sql`
    INSERT INTO quotes (
      number,
      customer_id,
      subtotal,
      total,
      status,
      payment_status,
      created_at,
      updated_at
    )
    SELECT
      ${quoteNumber},
      id,
      100.00,
      100.00,
      'sent',
      'pending',
      NOW(),
      NOW()
    FROM customers
    LIMIT 1
    RETURNING id, number
  `;

  return result[0] as { id: string; number: string };
}

// Helper function to cleanup test quote
async function cleanupTestQuote(quoteId: string) {
  await sql`DELETE FROM quotes WHERE id = ${quoteId}::uuid`;
}

describe('Square Webhook Integration', () => {
  let testQuote: { id: string; number: string };

  beforeAll(async () => {
    // Create a test quote for webhook testing
    testQuote = await createTestQuote();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testQuote) {
      await cleanupTestQuote(testQuote.id);
    }
  });

  describe('Signature Verification', () => {
    test('should reject webhook with missing signature', async () => {
      const payload = {
        merchant_id: 'test-merchant',
        type: 'payment.created',
        event_id: 'test-event-1',
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: 'test-payment-1',
          object: { payment: { id: 'test-payment-1' } }
        }
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing signature');
    });

    test('should reject webhook with invalid signature', async () => {
      const payload = {
        merchant_id: 'test-merchant',
        type: 'payment.created',
        event_id: 'test-event-2',
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: 'test-payment-2',
          object: { payment: { id: 'test-payment-2' } }
        }
      };

      const body = JSON.stringify(payload);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': 'invalid-signature',
        },
        body,
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid signature');
    });

    test('should accept webhook with valid signature', async () => {
      const payload = {
        merchant_id: 'test-merchant',
        location_id: 'test-location',
        type: 'payment.created',
        event_id: `test-event-${Date.now()}`,
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: 'test-payment-valid',
          object: {
            payment: {
              id: 'test-payment-valid',
              status: 'PENDING',
              amount_money: {
                amount: 10000,
                currency: 'USD'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              reference_id: testQuote.number,
              location_id: 'test-location',
              source_type: 'CARD'
            }
          }
        }
      };

      const body = JSON.stringify(payload);
      const signature = generateSquareSignature(body, TEST_SIGNATURE_KEY);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature,
        },
        body,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.eventId).toBe(payload.event_id);
    });
  });

  describe('Payment Event Processing', () => {
    test('should update quote status to processing on PENDING payment', async () => {
      const eventId = `test-pending-${Date.now()}`;
      const paymentId = `payment-pending-${Date.now()}`;

      const payload = {
        merchant_id: 'test-merchant',
        location_id: 'test-location',
        type: 'payment.created',
        event_id: eventId,
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: paymentId,
          object: {
            payment: {
              id: paymentId,
              status: 'PENDING',
              amount_money: {
                amount: 10000,
                currency: 'USD'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              reference_id: testQuote.number,
              location_id: 'test-location',
              source_type: 'CARD'
            }
          }
        }
      };

      const body = JSON.stringify(payload);
      const signature = generateSquareSignature(body, TEST_SIGNATURE_KEY);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature,
        },
        body,
      });

      expect(response.status).toBe(200);

      // Verify database update
      const updated: any[] = await sql`
        SELECT payment_id, payment_status, status
        FROM quotes
        WHERE number = ${testQuote.number}
      `;

      expect(updated[0].payment_id).toBe(paymentId);
      expect(updated[0].payment_status).toBe('processing');
    });

    test('should update quote to accepted and set paid_at on COMPLETED payment', async () => {
      const eventId = `test-completed-${Date.now()}`;
      const paymentId = `payment-completed-${Date.now()}`;
      const paidAt = new Date().toISOString();

      const payload = {
        merchant_id: 'test-merchant',
        location_id: 'test-location',
        type: 'payment.updated',
        event_id: eventId,
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: paymentId,
          object: {
            payment: {
              id: paymentId,
              status: 'COMPLETED',
              amount_money: {
                amount: 10000,
                currency: 'USD'
              },
              created_at: new Date().toISOString(),
              updated_at: paidAt,
              reference_id: testQuote.number,
              location_id: 'test-location',
              source_type: 'CARD'
            }
          }
        }
      };

      const body = JSON.stringify(payload);
      const signature = generateSquareSignature(body, TEST_SIGNATURE_KEY);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature,
        },
        body,
      });

      expect(response.status).toBe(200);

      // Verify database update
      const updated: any[] = await sql`
        SELECT payment_id, payment_status, status, paid_at
        FROM quotes
        WHERE number = ${testQuote.number}
      `;

      expect(updated[0].payment_id).toBe(paymentId);
      expect(updated[0].payment_status).toBe('completed');
      expect(updated[0].status).toBe('accepted');
      expect(updated[0].paid_at).toBeTruthy();
    });

    test('should handle FAILED payment status', async () => {
      const eventId = `test-failed-${Date.now()}`;
      const paymentId = `payment-failed-${Date.now()}`;

      const payload = {
        merchant_id: 'test-merchant',
        location_id: 'test-location',
        type: 'payment.updated',
        event_id: eventId,
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: paymentId,
          object: {
            payment: {
              id: paymentId,
              status: 'FAILED',
              amount_money: {
                amount: 10000,
                currency: 'USD'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              reference_id: testQuote.number,
              location_id: 'test-location',
              source_type: 'CARD'
            }
          }
        }
      };

      const body = JSON.stringify(payload);
      const signature = generateSquareSignature(body, TEST_SIGNATURE_KEY);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature,
        },
        body,
      });

      expect(response.status).toBe(200);

      // Verify database update
      const updated: any[] = await sql`
        SELECT payment_id, payment_status
        FROM quotes
        WHERE number = ${testQuote.number}
      `;

      expect(updated[0].payment_id).toBe(paymentId);
      expect(updated[0].payment_status).toBe('failed');
    });
  });

  describe('Idempotency', () => {
    test('should handle duplicate webhook events gracefully', async () => {
      const eventId = `test-idempotent-${Date.now()}`;
      const paymentId = `payment-idempotent-${Date.now()}`;

      const payload = {
        merchant_id: 'test-merchant',
        location_id: 'test-location',
        type: 'payment.created',
        event_id: eventId,
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: paymentId,
          object: {
            payment: {
              id: paymentId,
              status: 'COMPLETED',
              amount_money: {
                amount: 10000,
                currency: 'USD'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              reference_id: testQuote.number,
              location_id: 'test-location',
              source_type: 'CARD'
            }
          }
        }
      };

      const body = JSON.stringify(payload);
      const signature = generateSquareSignature(body, TEST_SIGNATURE_KEY);

      // Send webhook twice
      const response1 = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature,
        },
        body,
      });

      const response2 = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature,
        },
        body,
      });

      // Both should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify only one update occurred (payment_id should be set only once)
      const updated: any[] = await sql`
        SELECT payment_id, payment_status, updated_at
        FROM quotes
        WHERE number = ${testQuote.number}
      `;

      expect(updated[0].payment_id).toBe(paymentId);
      expect(updated[0].payment_status).toBe('completed');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle webhook with missing payment data', async () => {
      const eventId = `test-missing-data-${Date.now()}`;

      const payload = {
        merchant_id: 'test-merchant',
        location_id: 'test-location',
        type: 'payment.created',
        event_id: eventId,
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: 'invalid',
          object: {} // Missing payment object
        }
      };

      const body = JSON.stringify(payload);
      const signature = generateSquareSignature(body, TEST_SIGNATURE_KEY);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature,
        },
        body,
      });

      // Should still return 200 (webhook processed, event logged but skipped)
      expect(response.status).toBe(200);
    });

    test('should handle webhook with invalid quote reference', async () => {
      const eventId = `test-invalid-ref-${Date.now()}`;
      const paymentId = `payment-invalid-ref-${Date.now()}`;

      const payload = {
        merchant_id: 'test-merchant',
        location_id: 'test-location',
        type: 'payment.created',
        event_id: eventId,
        created_at: new Date().toISOString(),
        data: {
          type: 'payment',
          id: paymentId,
          object: {
            payment: {
              id: paymentId,
              status: 'COMPLETED',
              amount_money: {
                amount: 10000,
                currency: 'USD'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              reference_id: 'NON-EXISTENT-QUOTE',
              location_id: 'test-location',
              source_type: 'CARD'
            }
          }
        }
      };

      const body = JSON.stringify(payload);
      const signature = generateSquareSignature(body, TEST_SIGNATURE_KEY);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature,
        },
        body,
      });

      // Should return 200 (webhook acknowledged, but no quote updated)
      expect(response.status).toBe(200);
    });
  });

  describe('Health Check', () => {
    test('GET request should return webhook status', async () => {
      const response = await fetch(WEBHOOK_URL, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.message).toBe('Square webhook endpoint is active');
      expect(data.timestamp).toBeTruthy();
    });
  });
});
