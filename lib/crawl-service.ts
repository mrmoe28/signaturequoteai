import { crawler } from './crawler';
import { upsertProduct, createCrawlJob, updateCrawlJob, getActiveCrawlJob } from './db/queries';
import { createLogger, logOperation } from './logger';
import type { CrawlJob } from './types';

const logger = createLogger('crawl-service');

// Common category URLs for Signature Solar
const SIGNATURE_SOLAR_CATEGORIES = [
  'https://signaturesolar.com/solar-panels/',
  'https://signaturesolar.com/solar-batteries/',
  'https://signaturesolar.com/solar-inverters/',
  'https://signaturesolar.com/solar-charge-controllers/',
  'https://signaturesolar.com/solar-accessories/',
  'https://signaturesolar.com/solar-kits/',
];

export class CrawlService {
  private static instance: CrawlService;
  
  static getInstance(): CrawlService {
    if (!CrawlService.instance) {
      CrawlService.instance = new CrawlService();
    }
    return CrawlService.instance;
  }

  async runFullCrawl(): Promise<CrawlJob> {
    // Check if there's already an active crawl job
    const activeJob = await getActiveCrawlJob();
    if (activeJob) {
      throw new Error(`Crawl already in progress (Job ID: ${activeJob.id})`);
    }

    return logOperation(logger, 'full_crawl', async () => {
      // Create crawl job
      const job = await createCrawlJob('full', undefined, {
        categories: SIGNATURE_SOLAR_CATEGORIES,
      });

      try {
        await updateCrawlJob(job.id, { status: 'running' });
        
        logger.info({ jobId: job.id }, 'Starting full crawl of all categories');
        
        let totalProcessed = 0;
        let totalUpdated = 0;

        for (const categoryUrl of SIGNATURE_SOLAR_CATEGORIES) {
          try {
            logger.info({ categoryUrl }, 'Crawling category');
            
            const productUrls = await crawler.crawlCategoryRecursively(categoryUrl);
            logger.info({ 
              categoryUrl, 
              productCount: productUrls.length 
            }, 'Found products in category');

            for (const productUrl of productUrls) {
              try {
                const result = await crawler.crawlProduct(productUrl);
                totalProcessed++;

                if (result.success && result.product) {
                  await upsertProduct(result.product);
                  totalUpdated++;
                  
                  logger.debug({ 
                    productId: result.product.id,
                    name: result.product.name,
                    price: result.product.price
                  }, 'Product updated');
                } else {
                  logger.warn({ 
                    productUrl, 
                    error: result.error 
                  }, 'Failed to crawl product');
                }

                // Update job progress periodically
                if (totalProcessed % 10 === 0) {
                  await updateCrawlJob(job.id, {
                    productsProcessed: totalProcessed,
                    productsUpdated: totalUpdated,
                  });
                }

              } catch (error) {
                logger.error({ 
                  productUrl, 
                  error 
                }, 'Error crawling individual product');
              }
            }

          } catch (error) {
            logger.error({ 
              categoryUrl, 
              error 
            }, 'Error crawling category');
          }
        }

        await updateCrawlJob(job.id, {
          status: 'completed',
          productsProcessed: totalProcessed,
          productsUpdated: totalUpdated,
        });

        logger.info({ 
          jobId: job.id,
          totalProcessed,
          totalUpdated 
        }, 'Full crawl completed successfully');

        return job;

      } catch (error) {
        await updateCrawlJob(job.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        logger.error({ jobId: job.id, error }, 'Full crawl failed');
        throw error;
      }
    });
  }

  async runCategoryCrawl(categoryUrl: string): Promise<CrawlJob> {
    return logOperation(logger, 'category_crawl', async () => {
      const job = await createCrawlJob('category', categoryUrl);

      try {
        await updateCrawlJob(job.id, { status: 'running' });
        
        logger.info({ jobId: job.id, categoryUrl }, 'Starting category crawl');
        
        const productUrls = await crawler.crawlCategoryRecursively(categoryUrl);
        let totalProcessed = 0;
        let totalUpdated = 0;

        for (const productUrl of productUrls) {
          try {
            const result = await crawler.crawlProduct(productUrl);
            totalProcessed++;

            if (result.success && result.product) {
              await upsertProduct(result.product);
              totalUpdated++;
            }

            // Update progress
            if (totalProcessed % 5 === 0) {
              await updateCrawlJob(job.id, {
                productsProcessed: totalProcessed,
                productsUpdated: totalUpdated,
              });
            }

          } catch (error) {
            logger.error({ 
              productUrl, 
              error 
            }, 'Error crawling product in category');
          }
        }

        await updateCrawlJob(job.id, {
          status: 'completed',
          productsProcessed: totalProcessed,
          productsUpdated: totalUpdated,
        });

        logger.info({ 
          jobId: job.id,
          categoryUrl,
          totalProcessed,
          totalUpdated 
        }, 'Category crawl completed');

        return job;

      } catch (error) {
        await updateCrawlJob(job.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    }, { categoryUrl });
  }

  async runProductRefresh(productUrl: string): Promise<CrawlJob> {
    return logOperation(logger, 'product_refresh', async () => {
      const job = await createCrawlJob('product', productUrl);

      try {
        await updateCrawlJob(job.id, { status: 'running' });
        
        const result = await crawler.crawlProduct(productUrl);
        
        if (result.success && result.product) {
          await upsertProduct(result.product);
          
          await updateCrawlJob(job.id, {
            status: 'completed',
            productsProcessed: 1,
            productsUpdated: 1,
          });
          
          logger.info({ 
            jobId: job.id,
            productId: result.product.id 
          }, 'Product refresh completed');
        } else {
          throw new Error(result.error || 'Failed to crawl product');
        }

        return job;

      } catch (error) {
        await updateCrawlJob(job.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    }, { productUrl });
  }

  async getJobStatus(jobId: string): Promise<CrawlJob | null> {
    // This would need to be implemented in queries.ts
    // For now, return null as placeholder
    return null;
  }
}

export const crawlService = CrawlService.getInstance();