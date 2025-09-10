# Email Setup Guide

This guide explains how to set up email functionality for sending quotes using Google Gmail API.

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Gmail API Credentials
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Optional: Email Configuration
FROM_EMAIL="your-email@gmail.com"
FROM_NAME="Signature QuoteCrawler"
```

## Email Service Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 2. Service Account Setup

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `gmail-quote-sender`
   - Description: `Service account for sending quote emails`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. Generate Service Account Key

1. In the Credentials page, find your service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format and click "Create"
6. Download the JSON file

### 4. Extract Credentials

From the downloaded JSON file, extract:
- `client_email` → `GOOGLE_CLIENT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`

### 5. Gmail Account Setup

1. Use the service account email (`GOOGLE_CLIENT_EMAIL`) to send emails
2. Or delegate sending permissions to your Gmail account:
   - In Gmail, go to Settings > Accounts and Import
   - Add the service account email as a delegate
   - Grant "Send mail as" permissions

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
   - Check GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are set correctly
   - Verify Gmail API is enabled in Google Cloud Console
   - Check service account permissions
   - Ensure private key format is correct (with \n for line breaks)

2. **Authentication errors**
   - Verify service account credentials are valid
   - Check that the service account has Gmail API access
   - Ensure private key is properly formatted in environment variables

3. **PDF not generating**
   - Check server logs for PDF generation errors
   - Verify quote data is complete
   - Test PDF endpoint directly
   - Ensure Puppeteer is properly installed

4. **Email formatting issues**
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
