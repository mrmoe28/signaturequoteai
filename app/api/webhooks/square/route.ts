import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac } from 'crypto';
import { createLogger } from '@/lib/logger';
import { updateQuoteStatus } from '@/lib/db/queries';
import { db, sql } from '@/lib/db';

const logger = createLogger('square-webhook');

// Square webhook event types we care about
const WEBHOOK_EVENTS = {
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_UPDATED: 'payment.updated',
  CHECKOUT_COMPLETED: 'checkout.completed',
} as const;

interface SquareWebhookEvent {
  merchant_id: string;
  location_id: string;
  event_id: string;
  created_at: string;
  type: string;
  data: {
    type: string;
    id: string;
    object: {
      payment?: {
        id: string;
        created_at: string;
        updated_at: string;
        amount_money: {
          amount: number;
          currency: string;
        };
        status: 'PENDING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
        delay_duration?: string;
        source_type: string;
        card_details?: any;
        cash_details?: any;
        external_details?: any;
        wallet_details?: any;
        location_id: string;
        order_id?: string;
        reference_id?: string;
        customer_id?: string;
        employee_id?: string;
        team_member_id?: string;
        refund_ids?: string[];
        risk_evaluation?: any;
        buyer_email_address?: string;
        billing_address?: any;
        shipping_address?: any;
        note?: string;
        statement_description_identifier?: string;
        capabilities?: string[];
        receipt_number?: string;
        receipt_url?: string;
        device_details?: any;
        application_details?: any;
        version_token?: string;
      };
      order?: {
        id: string;
        location_id: string;
        reference_id?: string;
        source: any;
        customer_id?: string;
        line_items?: any[];
        taxes?: any[];
        discounts?: any[];
        service_charges?: any[];
        fulfillments?: any[];
        returns?: any[];
        return_amounts?: any;
        net_amounts: any;
        rounding_adjustment?: any;
        tenders?: any[];
        refunds?: any[];
        metadata?: Record<string, string>;
        created_at: string;
        updated_at: string;
        state: 'PENDING' | 'OPEN' | 'COMPLETED' | 'CANCELED';
        version: number;
        total_money?: {
          amount: number;
          currency: string;
        };
        total_tax_money?: {
          amount: number;
          currency: string;
        };
        total_discount_money?: {
          amount: number;
          currency: string;
        };
        total_tip_money?: {
          amount: number;
          currency: string;
        };
        total_service_charge_money?: {
          amount: number;
          currency: string;
        };
        ticket_name?: string;
        pricing_options?: any;
        rewards?: any[];
      };
    };
  };
}

function verifySquareSignature(body: string, signature: string, signatureKey: string): boolean {
  try {
    const hash = createHmac('sha256', signatureKey)
      .update(body)
      .digest('base64');
    
    return hash === signature;
  } catch (error) {
    logger.error({ error }, 'Error verifying Square signature');
    return false;
  }
}

function getQuoteIdFromReference(referenceId: string | undefined): string | null {
  if (!referenceId) return null;
  
  // Reference ID format: "Q-2024-001" or direct quote ID
  // Try to extract quote ID from various formats
  if (referenceId.startsWith('Q-')) {
    return referenceId;
  }
  
  // If it looks like a UUID, return as-is
  if (referenceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return referenceId;
  }
  
  return referenceId;
}

async function updateQuotePaymentStatus(
  quoteId: string, 
  paymentId: string, 
  status: string, 
  amount?: number,
  paidAt?: string
) {
  try {
    const updateData: any = {
      paymentId,
      paymentStatus: mapSquareStatusToPaymentStatus(status),
      updatedAt: new Date()
    };

    if (status === 'COMPLETED' && paidAt) {
      updateData.paidAt = new Date(paidAt);
      updateData.status = 'accepted'; // Update quote status to accepted when paid
    }

    await sql`
      UPDATE quotes 
      SET 
        payment_id = ${paymentId},
        payment_status = ${updateData.paymentStatus},
        updated_at = ${updateData.updatedAt},
        ${status === 'COMPLETED' ? sql`paid_at = ${updateData.paidAt}, status = ${updateData.status}` : sql``}
      WHERE number = ${quoteId} OR id = ${quoteId}::uuid
    `;

    logger.info({ 
      quoteId, 
      paymentId, 
      status: updateData.paymentStatus 
    }, 'Quote payment status updated');

  } catch (error) {
    logger.error({ error, quoteId, paymentId }, 'Failed to update quote payment status');
    throw error;
  }
}

function mapSquareStatusToPaymentStatus(squareStatus: string): string {
  switch (squareStatus) {
    case 'PENDING':
      return 'processing';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELED':
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
}

async function handlePaymentEvent(event: SquareWebhookEvent) {
  const payment = event.data.object.payment;
  if (!payment) {
    logger.warn({ eventId: event.event_id }, 'Payment event missing payment data');
    return;
  }

  const quoteId = getQuoteIdFromReference(payment.reference_id);
  if (!quoteId) {
    logger.warn({ 
      eventId: event.event_id, 
      referenceId: payment.reference_id 
    }, 'No quote ID found in payment reference');
    return;
  }

  logger.info({
    eventId: event.event_id,
    paymentId: payment.id,
    quoteId,
    status: payment.status,
    amount: payment.amount_money.amount
  }, 'Processing payment event');

  await updateQuotePaymentStatus(
    quoteId,
    payment.id,
    payment.status,
    payment.amount_money.amount,
    payment.status === 'COMPLETED' ? payment.updated_at : undefined
  );
}

async function handleOrderEvent(event: SquareWebhookEvent) {
  const order = event.data.object.order;
  if (!order) {
    logger.warn({ eventId: event.event_id }, 'Order event missing order data');
    return;
  }

  const quoteId = getQuoteIdFromReference(order.reference_id);
  if (!quoteId) {
    logger.warn({ 
      eventId: event.event_id, 
      referenceId: order.reference_id 
    }, 'No quote ID found in order reference');
    return;
  }

  logger.info({
    eventId: event.event_id,
    orderId: order.id,
    quoteId,
    state: order.state,
    total: order.total_money?.amount
  }, 'Processing order event');

  // Handle order completion
  if (order.state === 'COMPLETED') {
    // Find associated payment if any
    const tender = order.tenders?.[0];
    if (tender) {
      await updateQuotePaymentStatus(
        quoteId,
        tender.id || order.id,
        'COMPLETED',
        order.total_money?.amount,
        order.updated_at
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-square-signature');
    
    if (!signature) {
      logger.warn('Missing Square signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!signatureKey) {
      logger.error('Square webhook signature key not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (!verifySquareSignature(body, signature, signatureKey)) {
      logger.warn({ signature }, 'Invalid Square webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    let event: SquareWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      logger.error({ error, body }, 'Failed to parse webhook body');
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    logger.info({
      eventId: event.event_id,
      eventType: event.type,
      merchantId: event.merchant_id,
      locationId: event.location_id
    }, 'Received Square webhook');

    // Handle different event types
    switch (event.type) {
      case WEBHOOK_EVENTS.PAYMENT_CREATED:
      case WEBHOOK_EVENTS.PAYMENT_UPDATED:
        await handlePaymentEvent(event);
        break;
        
      case WEBHOOK_EVENTS.CHECKOUT_COMPLETED:
        await handleOrderEvent(event);
        break;
        
      default:
        logger.info({ eventType: event.type }, 'Unhandled webhook event type');
        break;
    }

    return NextResponse.json({
      success: true,
      eventId: event.event_id,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    logger.error({ error }, 'Error processing Square webhook');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Square webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}