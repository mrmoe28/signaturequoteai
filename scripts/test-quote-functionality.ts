import { db } from '../lib/db/index';
import { quotes } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateQuotePDF } from '../lib/pdf-generator-stable';
import { sendQuoteEmail } from '../lib/email';

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
      // Convert the database quote to the expected DatabaseQuote format
      const quoteForPDF = {
        id: testQuote.id,
        number: testQuote.number,
        createdAt: testQuote.createdAt,
        validUntil: testQuote.validUntil,
        preparedBy: testQuote.preparedBy,
        leadTimeNote: testQuote.leadTimeNote,
        discount: testQuote.discount,
        shipping: testQuote.shipping,
        tax: testQuote.tax,
        subtotal: testQuote.subtotal,
        total: testQuote.total,
        terms: testQuote.terms,
        customerCompany: testQuote.customerCompany,
        customerName: testQuote.customerName,
        customerEmail: testQuote.customerEmail,
        customerPhone: testQuote.customerPhone,
        customerShipTo: testQuote.customerShipTo,
        customer: {
          company: testQuote.customerCompany || undefined,
          name: testQuote.customerName,
          email: testQuote.customerEmail || undefined,
          phone: testQuote.customerPhone || undefined,
          shipTo: testQuote.customerShipTo || undefined,
        },
        items: [] as Array<{
          id: string;
          quoteId: string;
          productId: string;
          name: string;
          unitPrice: number;
          quantity: number;
          extended: number;
          notes: string | null;
        }>
      };
      
      const pdfBuffer = await generateQuotePDF(quoteForPDF);
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (error) {
      console.log('❌ PDF generation failed:', error instanceof Error ? error.message : 'Unknown error');
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
        
        const result = await sendQuoteEmail(emailData);
        console.log('✅ Email sent successfully:', result.messageId);
      } catch (error) {
        console.log('❌ Email sending failed:', error instanceof Error ? error.message : 'Unknown error');
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
