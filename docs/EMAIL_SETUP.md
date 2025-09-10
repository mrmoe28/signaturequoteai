# Email Setup Guide

This guide explains how to set up email functionality for sending quotes.

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Email Service (Resend)
RESEND_API_KEY="re_your_resend_api_key_here"

# Optional: Email Configuration
FROM_EMAIL="quotes@yourdomain.com"
FROM_NAME="Signature QuoteCrawler"
```

## Email Service Setup

### 1. Resend Account Setup

1. Go to [Resend.com](https://resend.com) and create an account
2. Verify your domain or use their test domain
3. Get your API key from the dashboard
4. Add the API key to your environment variables

### 2. Domain Configuration (Optional)

For production use, you should:
1. Add your domain to Resend
2. Configure DNS records (SPF, DKIM, DMARC)
3. Update the `FROM_EMAIL` in your environment variables

## Features

### Email Functionality
- **Professional Email Templates**: HTML and text versions
- **PDF Attachments**: Quotes are automatically attached as PDFs
- **Customer Information**: Personalized emails with customer details
- **Quote Details**: Includes quote number, total, and validity period

### PDF Generation
- **Professional Layout**: Clean, printable PDF format
- **Complete Quote Details**: All items, pricing, and customer information
- **Branded Design**: Consistent with your application branding

## API Endpoints

### Send Quote Email
```
POST /api/quotes/[id]/send
```
Sends a quote email to the customer with PDF attachment.

### Download Quote PDF
```
GET /api/quotes/[id]/pdf
```
Downloads the quote as a PDF file.

## Email Template Features

### HTML Email
- Responsive design
- Professional branding
- Clear quote information
- Call-to-action sections
- Footer with company information

### Text Email
- Plain text version for email clients that don't support HTML
- Same information as HTML version
- Clean, readable format

## PDF Features

### Professional Layout
- Company header and branding
- Quote details and customer information
- Itemized product list with pricing
- Totals breakdown (subtotal, discount, shipping, tax)
- Terms and conditions section
- Lead time information

### Print-Ready
- Optimized for A4 paper size
- Clean typography and spacing
- Professional color scheme
- Print-friendly margins

## Error Handling

The system includes comprehensive error handling:
- Email service failures
- PDF generation errors
- Missing customer information
- Invalid quote data

## Testing

### Development Testing
1. Use Resend's test domain for development
2. Check email delivery in Resend dashboard
3. Test PDF generation and download

### Production Testing
1. Send test emails to your own address
2. Verify PDF attachments
3. Check email formatting across different clients

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check RESEND_API_KEY is set correctly
   - Verify domain configuration in Resend
   - Check email address format

2. **PDF not generating**
   - Check server logs for PDF generation errors
   - Verify quote data is complete
   - Test PDF endpoint directly

3. **Email formatting issues**
   - Test in different email clients
   - Check HTML template syntax
   - Verify responsive design

### Logs
Check the application logs for detailed error information:
- Email sending logs
- PDF generation logs
- API endpoint logs

## Security Considerations

- Never expose API keys in client-side code
- Use environment variables for all sensitive configuration
- Validate email addresses before sending
- Implement rate limiting for email endpoints
- Monitor email sending for abuse

## Cost Considerations

- Resend pricing: Check current rates at resend.com
- PDF generation: Minimal server resources
- Email storage: Consider retention policies
- Bandwidth: PDF attachments increase email size
