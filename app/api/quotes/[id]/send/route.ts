import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getQuoteById } from '@/lib/db/queries';
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
    const quote = await getQuoteById(quoteId);
    
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (!quote.customerEmail) {
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
      quoteId: quote.id,
      quoteNumber: quote.number,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerCompany: quote.customerCompany,
      total: parseFloat(quote.total),
      validUntil: quote.validUntil?.toISOString(),
      pdfBuffer,
      items: quote.items.map(i => ({
        name: i.name,
        sku: undefined,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        extended: i.extended,
      })),
    };

    // Send email
    const result = await sendQuoteEmail(emailData);

    logger.info({ 
      quoteId, 
      messageId: result.messageId,
      customerEmail: quote.customerEmail 
    }, 'Quote email sent successfully');

    return NextResponse.json({
      success: true,
      data: {
        quoteId,
        messageId: result.messageId,
        customerEmail: quote.customerEmail,
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
