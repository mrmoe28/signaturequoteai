import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getQuoteById, updateQuoteStatus } from '@/lib/db/queries';
import { sendQuoteEmail, EmailQuoteData } from '@/lib/email';
import { generateQuotePDF } from '@/lib/pdf-generator';

const logger = createLogger('api-quotes-send');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    
    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    logger.info({ quoteId }, 'Sending quote email');

    // Get quote from database
    let quote;
    try {
      quote = await getQuoteById(quoteId);
    } catch (dbError) {
      logger.error({ error: dbError, quoteId }, 'Database error fetching quote');
      return NextResponse.json(
        { success: false, error: 'Database connection error', message: 'Please check database configuration' },
        { status: 500 }
      );
    }
    
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (!quote.customer?.email) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required to send quote' },
        { status: 400 }
      );
    }

    // Generate PDF
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateQuotePDF(quote);
      logger.info({ quoteId }, 'PDF generated successfully');
    } catch (error) {
      logger.warn({ error, quoteId }, 'PDF generation failed, sending email without PDF');
    }

    // Prepare email data
    const emailData: EmailQuoteData = {
      quoteId: quote.id || '',
      quoteNumber: quote.number,
      customerName: quote.customer.name,
      customerEmail: quote.customer.email,
      customerCompany: quote.customer.company,
      total: typeof quote.total === 'string' ? parseFloat(quote.total) : quote.total,
      validUntil: quote.validUntil,
      pdfBuffer,
      items: quote.items.map(item => ({
        name: item.name,
        quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : Number(item.quantity),
        unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : Number(item.unitPrice),
        extended: typeof item.extended === 'string' ? parseFloat(item.extended) : Number(item.extended),
        imageUrl: item.imageUrl,
      })),
    };

    // Send email
    const result = await sendQuoteEmail(emailData);

    // Update quote status to 'sent'
    try {
      await updateQuoteStatus(quoteId, 'sent');
    } catch (dbError) {
      logger.warn({ error: dbError, quoteId }, 'Failed to update quote status but email was sent');
      // Don't fail the request since email was successfully sent
    }

    logger.info({
      quoteId,
      messageId: result.messageId,
      customerEmail: quote.customer.email
    }, 'Quote email sent successfully');

    return NextResponse.json({
      success: true,
      data: {
        quoteId,
        messageId: result.messageId,
        customerEmail: quote.customer.email,
        hasPdf: !!pdfBuffer,
      },
      message: 'Quote sent successfully',
    });

  } catch (error) {
    logger.error({ error, quoteId: params.id }, 'Failed to send quote email');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send quote email',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
