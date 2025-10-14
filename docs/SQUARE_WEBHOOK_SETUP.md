# Square Webhook Setup Guide

## Overview

This guide explains how to set up and configure Square webhooks for payment notifications in the SignatureQuoteAI application.

## Webhook Endpoint

**URL**: `/api/webhooks/square`
- **Local**: `http://localhost:3000/api/webhooks/square`
- **Production**: `https://yourdomain.com/api/webhooks/square`

## Supported Events

The webhook endpoint handles the following Square events:

### 1. `payment.created`
- Triggered when a payment is initiated
- Updates quote status to "processing"

### 2. `payment.updated` 
- Triggered when payment status changes
- Updates quote payment status based on Square payment status:
  - `PENDING` → `processing`
  - `COMPLETED` → `completed` (also marks quote as `accepted`)
  - `CANCELED`/`FAILED` → `failed`

### 3. `checkout.completed`
- Triggered when a checkout session completes
- Handles order completion and payment finalization

## Environment Variables

### Required Configuration

```env
# Square Webhook Configuration
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key_here
```

### Complete Square Environment Setup

```env
# Square Configuration
SQUARE_ENVIRONMENT=sandbox  # or 'production'
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key
```

## Square Dashboard Configuration

### 1. Access Webhooks Settings
1. Log into [Square Developer Dashboard](https://developer.squareup.com/)
2. Navigate to your application
3. Go to "Webhooks" section

### 2. Create Webhook Endpoint
1. Click "Create Webhook"
2. **Endpoint URL**: `https://yourdomain.com/api/webhooks/square`
3. **Events to Subscribe**:
   - `payment.created`
   - `payment.updated`
   - `checkout.completed`

### 3. Get Signature Key
1. After creating the webhook, copy the **Signature Key**
2. Add it to your environment variables as `SQUARE_WEBHOOK_SIGNATURE_KEY`

### 4. Test Webhook
1. Use Square's webhook testing tool in the dashboard
2. Or use our testing scripts (see below)

## Testing

### Local Testing Scripts

```bash
# Test signature verification
npm run webhook:signature

# Health check
npm run webhook:health

# Send test webhook events
npm run webhook:test
```

### Advanced Testing

```bash
# Test against production endpoint
WEBHOOK_URL=https://yourdomain.com/api/webhooks/square npm run webhook:test

# Test with custom signature key
SQUARE_WEBHOOK_SIGNATURE_KEY=your-key npm run webhook:test
```

### Manual Testing with cURL

```bash
# Test webhook endpoint health
curl -X GET https://yourdomain.com/api/webhooks/square

# Test webhook with sample payload (replace signature)
curl -X POST https://yourdomain.com/api/webhooks/square \
  -H "Content-Type: application/json" \
  -H "x-square-signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "merchant_id": "test",
    "location_id": "test",
    "event_id": "test-123",
    "created_at": "2024-01-01T00:00:00Z",
    "type": "payment.updated",
    "data": {
      "type": "payment",
      "id": "test-payment",
      "object": {
        "payment": {
          "id": "test-payment-123",
          "status": "COMPLETED",
          "reference_id": "Q-2024-001",
          "amount_money": {
            "amount": 150000,
            "currency": "USD"
          },
          "updated_at": "2024-01-01T00:00:00Z"
        }
      }
    }
  }'
```

## Security Features

### 1. Signature Verification
- All webhook requests are verified using HMAC-SHA256
- Invalid signatures are rejected with 401 status
- Prevents webhook spoofing and tampering

### 2. Event Validation
- Validates webhook event structure
- Handles malformed JSON gracefully
- Logs all webhook attempts for debugging

### 3. Error Handling
- Comprehensive error logging
- Graceful degradation for missing data
- Returns appropriate HTTP status codes

## Database Integration

### Quote Status Flow

```
Draft → Sent → Processing → Completed
                     ↓
                   Failed
```

### Payment Status Mapping

| Square Status | App Payment Status | Quote Status |
|--------------|-------------------|--------------|
| `PENDING`    | `processing`      | `sent`       |
| `COMPLETED`  | `completed`       | `accepted`   |
| `CANCELED`   | `failed`          | `sent`       |
| `FAILED`     | `failed`          | `sent`       |

### Database Updates

When payment is completed:
1. `payment_status` → `completed`
2. `payment_id` → Square payment ID
3. `paid_at` → Payment completion timestamp
4. `status` → `accepted`
5. `updated_at` → Current timestamp

## Monitoring and Logs

### Log Events
- All webhook requests are logged with event details
- Payment status changes are tracked
- Database updates are logged
- Errors are logged with full context

### Log Levels
- `INFO`: Normal webhook processing
- `WARN`: Missing data or unhandled events
- `ERROR`: Processing failures or system errors

### Example Log Output

```json
{
  "level": "info",
  "eventId": "webhook-123",
  "eventType": "payment.updated",
  "paymentId": "pay-123",
  "quoteId": "Q-2024-001",
  "status": "COMPLETED",
  "message": "Processing payment event"
}
```

## Troubleshooting

### Common Issues

#### 1. Invalid Signature
- **Error**: 401 Unauthorized
- **Cause**: Wrong `SQUARE_WEBHOOK_SIGNATURE_KEY`
- **Solution**: Verify signature key in Square Dashboard

#### 2. Quote Not Found
- **Log**: "No quote ID found in payment reference"
- **Cause**: Missing or invalid `reference_id` in payment
- **Solution**: Ensure quotes include proper reference ID when creating payments

#### 3. Database Update Fails
- **Error**: 500 Internal Server Error
- **Cause**: Database connection or schema issues
- **Solution**: Check database connectivity and run migrations

#### 4. Webhook Not Received
- **Cause**: Firewall, incorrect URL, or Square configuration
- **Solution**: 
  - Verify webhook URL in Square Dashboard
  - Check firewall settings
  - Test endpoint health: `GET /api/webhooks/square`

### Debug Mode

Enable detailed logging by setting:
```env
LOG_LEVEL=debug
```

## Next Steps

1. **Configure Square Dashboard**: Set up webhook endpoint and get signature key
2. **Deploy to Production**: Ensure environment variables are set
3. **Test Integration**: Use testing scripts to verify functionality
4. **Monitor**: Set up log monitoring for webhook events
5. **Handle Edge Cases**: Monitor for any additional event types needed

## Support

For issues with this webhook implementation:
1. Check application logs for detailed error information
2. Test webhook endpoint health
3. Verify Square Dashboard configuration
4. Use testing scripts to isolate issues