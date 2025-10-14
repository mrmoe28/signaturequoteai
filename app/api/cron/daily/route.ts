import { NextRequest, NextResponse } from 'next/server';
import { crawlService } from '@/lib/crawl-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cron-daily');

// Force dynamic rendering - don't prerender this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const cronSecret = process.env.VERCEL_CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn({ authHeader }, 'Unauthorized cron request');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    logger.info('Starting daily crawl job');

    // Run the full crawl
    const job = await crawlService.runFullCrawl();

    logger.info({ 
      jobId: job.id,
      status: job.status 
    }, 'Daily crawl job initiated');

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        startedAt: job.startedAt,
      },
      message: 'Daily crawl job started successfully',
    });

  } catch (error) {
    logger.error({ error }, 'Daily crawl job failed to start');

    // If there's already an active job, return a different status
    if (error instanceof Error && error.message.includes('already in progress')) {
      return NextResponse.json({
        success: false,
        error: 'Crawl already in progress',
        message: error.message,
      }, { status: 409 }); // Conflict status
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to start daily crawl',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Support GET for manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  // Simple secret check for manual testing
  if (process.env.NODE_ENV === 'production' && secret !== process.env.VERCEL_CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    logger.info('Manual daily crawl trigger');
    
    const job = await crawlService.runFullCrawl();
    
    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        startedAt: job.startedAt,
      },
      message: 'Daily crawl job started manually',
    });

  } catch (error) {
    logger.error({ error }, 'Manual daily crawl failed');

    if (error instanceof Error && error.message.includes('already in progress')) {
      return NextResponse.json({
        success: false,
        error: 'Crawl already in progress',
        message: error.message,
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to start manual crawl',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}