import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getCompanySettings, updateCompanySettings } from '@/lib/db/queries';

const logger = createLogger('api-company');

export async function GET() {
  try {
    logger.info('Fetching company settings');
    
    const settings = await getCompanySettings();
    
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'No company settings found' },
        { status: 404 }
      );
    }

    logger.info('Company settings fetched successfully');
    
    return NextResponse.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    logger.error({ error }, 'Failed to fetch company settings');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch company settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    logger.info('Updating company settings');

    // Validate required fields
    if (!body.companyName) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    const updatedSettings = await updateCompanySettings({
      companyName: body.companyName,
      companyLogo: body.companyLogo,
      companyAddress: body.companyAddress,
      companyCity: body.companyCity,
      companyState: body.companyState,
      companyZip: body.companyZip,
      companyPhone: body.companyPhone,
      companyEmail: body.companyEmail,
      companyWebsite: body.companyWebsite,
      taxId: body.taxId,
      defaultTerms: body.defaultTerms,
      defaultLeadTime: body.defaultLeadTime,
      quotePrefix: body.quotePrefix,
    });

    logger.info('Company settings updated successfully');

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Company settings updated successfully',
    });

  } catch (error) {
    logger.error({ error }, 'Failed to update company settings');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update company settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
