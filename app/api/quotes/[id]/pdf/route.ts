import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getQuoteById } from '@/lib/db/queries';
import { generateQuotePDF } from '@/lib/pdf-generator';

const logger = createLogger('api-quotes-pdf');

export async function GET(
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

    logger.info({ quoteId }, 'Generating quote PDF');

    // Get quote from database
    const quote = await getQuoteById(quoteId);
    
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(quote);
    
    const filename = `quote-${quote.number || quoteId}.pdf`;

    logger.info({ quoteId, filename }, 'PDF generated successfully');

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    logger.error({ error, quoteId: params.id }, 'Failed to generate quote PDF');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
