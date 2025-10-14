import { NextRequest, NextResponse } from 'next/server';
import { CrawlService } from '@/lib/crawl-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-crawl');

// POST /api/crawl - Trigger a full crawl
export async function POST(request: NextRequest) {
  try {
    // In development, allow manual trigger without auth for testing
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
      // Verify Vercel Cron authentication in production
      const authHeader = request.headers.get('authorization');

      // Vercel Cron sends: Authorization: Bearer <VERCEL_CRON_SECRET>
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        if (token !== process.env.VERCEL_CRON_SECRET) {
          logger.warn({ authHeader: 'present' }, 'Invalid cron secret');
          return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
          );
        }
      } else {
        // No auth header - reject
        logger.warn('No authorization header provided');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      logger.info('Development mode: Skipping authentication');
    }

    logger.info('Starting full product crawl');

    const crawlService = CrawlService.getInstance();
    const job = await crawlService.runFullCrawl();

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        productsProcessed: job.productsProcessed,
        productsUpdated: job.productsUpdated,
      },
      message: 'Crawl job started successfully',
    });

  } catch (error) {
    logger.error({ error }, 'Failed to start crawl job');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start crawl',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/crawl - Get crawl status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const current = searchParams.get('current'); // Get current active job
    const limit = parseInt(searchParams.get('limit') || '10');

    const crawlService = CrawlService.getInstance();

    // If jobId is provided, get specific job
    if (jobId) {
      const job = await crawlService.getJobStatus(jobId);

      if (!job) {
        return NextResponse.json(
          {
            success: false,
            error: 'Job not found',
          },
          { status: 404 }
        );
      }

      // Calculate progress percentage and estimated completion
      const progress = calculateJobProgress(job);

      return NextResponse.json({
        success: true,
        data: {
          ...job,
          ...progress,
        },
      });
    }

    // If current flag is set, get active job
    if (current === 'true') {
      const job = await crawlService.getCurrentJob();

      if (!job) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No active crawl job',
        });
      }

      const progress = calculateJobProgress(job);

      return NextResponse.json({
        success: true,
        data: {
          ...job,
          ...progress,
        },
      });
    }

    // Otherwise, get recent jobs
    const jobs = await crawlService.getRecentJobs(limit);

    const jobsWithProgress = jobs.map(job => ({
      ...job,
      ...calculateJobProgress(job),
    }));

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobsWithProgress,
        total: jobs.length,
      },
    });

  } catch (error) {
    logger.error({ error }, 'Failed to get crawl status');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get crawl status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate job progress and metrics
function calculateJobProgress(job: any) {
  const { status, startedAt, completedAt, productsProcessed, productsUpdated, metadata } = job;

  const result: any = {
    progressPercentage: 0,
    estimatedCompletion: null,
    duration: null,
    avgProductsPerMinute: 0,
  };

  // For running jobs, calculate progress
  if (status === 'running' && startedAt) {
    const start = new Date(startedAt);
    const now = new Date();
    const durationMs = now.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    result.duration = Math.round(durationMs / 1000); // Duration in seconds

    // Calculate products per minute
    if (durationMinutes > 0 && productsProcessed > 0) {
      result.avgProductsPerMinute = Math.round(productsProcessed / durationMinutes);
    }

    // Estimate progress if we have total expected products in metadata
    if (metadata?.expectedTotal) {
      result.progressPercentage = Math.min(
        100,
        Math.round((productsProcessed / metadata.expectedTotal) * 100)
      );

      // Estimate completion time
      if (result.avgProductsPerMinute > 0) {
        const remainingProducts = metadata.expectedTotal - productsProcessed;
        const estimatedMinutesRemaining = remainingProducts / result.avgProductsPerMinute;
        result.estimatedCompletion = new Date(
          now.getTime() + estimatedMinutesRemaining * 60 * 1000
        ).toISOString();
      }
    } else {
      // If no expected total, show indeterminate progress
      result.progressPercentage = -1; // -1 indicates indeterminate
    }
  }

  // For completed jobs, calculate final metrics
  if (status === 'completed' && startedAt && completedAt) {
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    result.duration = Math.round(durationMs / 1000);
    result.progressPercentage = 100;

    if (durationMinutes > 0 && productsProcessed > 0) {
      result.avgProductsPerMinute = Math.round(productsProcessed / durationMinutes);
    }
  }

  // For failed jobs
  if (status === 'failed') {
    if (startedAt && completedAt) {
      const start = new Date(startedAt);
      const end = new Date(completedAt);
      result.duration = Math.round((end.getTime() - start.getTime()) / 1000);
    }
  }

  return result;
}
