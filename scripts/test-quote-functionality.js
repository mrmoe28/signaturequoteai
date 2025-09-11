import { db } from '../lib/db/index.js';
import { quotes } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { generateQuotePDF } from '../lib/pdf-generator.js';
import { sendQuoteEmailGmail } from '../lib/gmail-service.js';

async function testQuoteFunctionality() {
  try {
    console.log('🔍 Checking for existing quotes...');
    
    // Check if there are any quotes in the database
    const existingQuotes = await db.select().from(quotes).limit(5);
    console.log(`Found ${existingQuotes.length} quotes in database`);
    
    if (existingQuotes.length === 0) {
      console.log('❌ No quotes found in database. Please create a quote first.');
      return;
    }
    
    const testQuote = existingQuotes[0];
    console.log('📋 Testing with quote:', testQuote.id);
    console.log('Customer email:', testQuote.customerEmail);
    
    // Test PDF generation
    console.log('\n📄 Testing PDF generation...');
    try {
      const pdfBuffer = await generateQuotePDF(testQuote);
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (error) {
      console.log('❌ PDF generation failed:', error.message);
    }
    
    // Test email sending (only if customer email exists)
    if (testQuote.customerEmail) {
      console.log('\n📧 Testing email sending...');
      try {
        const emailData = {
          quoteId: testQuote.id,
          quoteNumber: testQuote.number,
          customerName: testQuote.customerName || 'Test Customer',
          customerEmail: testQuote.customerEmail,
          customerCompany: testQuote.customerCompany,
          total: parseFloat(testQuote.total),
          validUntil: testQuote.validUntil?.toISOString(),
        };
        
        const result = await sendQuoteEmailGmail(emailData);
        console.log('✅ Email sent successfully:', result.messageId);
      } catch (error) {
        console.log('❌ Email sending failed:', error.message);
        console.log('Error details:', error);
      }
    } else {
      console.log('⚠️  No customer email found, skipping email test');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testQuoteFunctionality();
