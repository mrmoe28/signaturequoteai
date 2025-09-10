import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { createLogger, logOperation } from './logger';
import { robotsChecker } from './robots-checker';
import type { 
  Product, 
  CrawlResult, 
  CategoryCrawlResult, 
  CrawlerConfig 
} from './types';

const logger = createLogger('crawler');

const DEFAULT_CONFIG: CrawlerConfig = {
  delayMs: parseInt(process.env.CRAWLER_DELAY_MS || '1000'),
  maxRetries: parseInt(process.env.CRAWLER_MAX_RETRIES || '3'),
  timeoutMs: parseInt(process.env.CRAWLER_TIMEOUT_MS || '30000'),
  userAgent: 'Mozilla/5.0 (compatible; SignatureQuoteCrawler/1.0; +https://yoursite.com/bot)',
  respectRobotsTxt: true,
};

export class SignatureSolarCrawler {
  private browser: Browser | null = null;
  private config: CrawlerConfig;
  private baseUrl = 'https://signaturesolar.com';

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.browser) return;

    await logOperation(logger, 'initialize_browser', async () => {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': this.config.userAgent
    });
    page.setDefaultTimeout(this.config.timeoutMs);
    
    return page;
  }

  private async delay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.config.delayMs));
  }

  private generateProductId(sku: string | undefined, name: string, url?: string): string {
    if (sku) return sku.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Generate from name and URL
    const nameSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    
    if (url) {
      const urlSlug = url.split('/').pop()?.replace(/\.html?$/, '') || '';
      return `${nameSlug}-${urlSlug}`.substring(0, 100);
    }
    
    return nameSlug.substring(0, 100);
  }

  private normalizeProduct(rawProduct: any, url?: string): Product {
    const name = rawProduct.name?.trim() || 'Unknown Product';
    const sku = rawProduct.sku?.trim();
    const price = parseFloat(rawProduct.price?.toString().replace(/[^0-9.]/g, '') || '0');
    
    return {
      id: this.generateProductId(sku, name, url),
      name,
      sku: sku || undefined,
      vendor: 'SignatureSolar',
      category: rawProduct.category?.trim(),
      unit: this.normalizeUnit(rawProduct.unit),
      price,
      currency: 'USD',
      url: url,
      lastUpdated: new Date().toISOString(),
      isActive: price > 0,
    };
  }

  private normalizeUnit(unit?: string): 'ea' | 'ft' | 'pack' {
    if (!unit) return 'ea';
    
    const normalized = unit.toLowerCase().trim();
    if (normalized.includes('ft') || normalized.includes('foot') || normalized.includes('feet')) {
      return 'ft';
    }
    if (normalized.includes('pack') || normalized.includes('pkg')) {
      return 'pack';
    }
    return 'ea';
  }

  async crawlCategory(categoryUrl: string): Promise<CategoryCrawlResult> {
    return logOperation(logger, 'crawl_category', async () => {
      // Check robots.txt if configured
      if (this.config.respectRobotsTxt) {
        const robotsCheck = await robotsChecker.canCrawl(categoryUrl, this.config.userAgent);
        if (!robotsCheck.allowed) {
          return {
            success: false,
            productUrls: [],
            error: `Blocked by robots.txt: ${robotsCheck.matchedRule}`,
          };
        }
        
        // Use robots.txt crawl delay if specified and longer than our default
        if (robotsCheck.crawlDelay && robotsCheck.crawlDelay > this.config.delayMs) {
          logger.info({ 
            url: categoryUrl,
            robotsDelay: robotsCheck.crawlDelay,
            configDelay: this.config.delayMs 
          }, 'Using robots.txt crawl delay');
          
          // Temporarily update delay for this request
          const originalDelay = this.config.delayMs;
          this.config.delayMs = robotsCheck.crawlDelay;
          
          // Restore original delay after this method
          process.nextTick(() => {
            this.config.delayMs = originalDelay;
          });
        }
      }

      const page = await this.createPage();
      
      try {
        await page.goto(categoryUrl, { waitUntil: 'networkidle' });
        
        // Wait for products to load
        await page.waitForSelector('.product-item, .product-card, [data-product]', { 
          timeout: 10000 
        }).catch(() => {
          logger.warn({ url: categoryUrl }, 'Product selector not found, trying fallback');
        });

        const productUrls: string[] = [];
        
        // Try multiple selectors for product links
        const selectors = [
          '.product-item a[href]',
          '.product-card a[href]',
          '[data-product] a[href]',
          '.product-title a[href]',
          '.item-title a[href]'
        ];

        for (const selector of selectors) {
          const links = await page.$$eval(selector, (elements) => 
            elements.map(el => (el as HTMLAnchorElement).href)
              .filter(href => href && href.includes('/products/'))
          ).catch(() => []);
          
          if (links.length > 0) {
            productUrls.push(...links);
            break;
          }
        }

        // Look for next page
        let nextPageUrl: string | undefined;
        try {
          const nextLink = await page.$('a[rel="next"], .next-page, .pagination-next');
          if (nextLink) {
            nextPageUrl = await nextLink.getAttribute('href') || undefined;
            if (nextPageUrl && !nextPageUrl.startsWith('http')) {
              nextPageUrl = new URL(nextPageUrl, this.baseUrl).href;
            }
          }
        } catch (error) {
          logger.debug({ error }, 'No next page found');
        }

        // Remove duplicates and filter valid URLs
        const uniqueUrls = Array.from(new Set(productUrls))
          .filter(url => url.includes('/products/'))
          .map(url => url.startsWith('http') ? url : new URL(url, this.baseUrl).href);

        await this.delay();

        return {
          success: true,
          productUrls: uniqueUrls,
          nextPageUrl,
        };

      } finally {
        await page.close();
      }
    }, { url: categoryUrl });
  }

  async crawlProduct(productUrl: string): Promise<CrawlResult> {
    return logOperation(logger, 'crawl_product', async () => {
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          const result = await this.crawlProductAttempt(productUrl);
          if (result.success) {
            return result;
          }
        } catch (error) {
          logger.warn({ 
            url: productUrl, 
            attempt, 
            error: error instanceof Error ? error.message : String(error) 
          }, `Crawl attempt ${attempt} failed`);
          
          if (attempt < this.config.maxRetries) {
            await this.delay();
          }
        }
      }

      return {
        success: false,
        error: `Failed after ${this.config.maxRetries} attempts`,
      };
    }, { url: productUrl });
  }

  private async crawlProductAttempt(productUrl: string): Promise<CrawlResult> {
    // Check robots.txt if configured
    if (this.config.respectRobotsTxt) {
      const robotsCheck = await robotsChecker.canCrawl(productUrl, this.config.userAgent);
      if (!robotsCheck.allowed) {
        return {
          success: false,
          error: `Blocked by robots.txt: ${robotsCheck.matchedRule}`,
        };
      }
    }

    const page = await this.createPage();
    
    try {
      await page.goto(productUrl, { waitUntil: 'networkidle' });
      
      // Wait for product content
      await page.waitForSelector('.product-title, .product-name, h1', { 
        timeout: 10000 
      });

      // Extract product data using multiple strategies
      const productData = await page.evaluate(() => {
        // Strategy 1: Structured data (JSON-LD)
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
          try {
            const data = JSON.parse(jsonLd.textContent || '');
            if (data['@type'] === 'Product') {
              return {
                name: data.name,
                sku: data.sku,
                price: data.offers?.price || data.offers?.[0]?.price,
                category: data.category,
                description: data.description,
              };
            }
          } catch (e) {
            // Fallback to DOM selectors
          }
        }

        // Strategy 2: Meta properties
        const getMetaContent = (property: string): string | null => {
          const meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
          return meta?.getAttribute('content') || null;
        };

        // Strategy 3: DOM selectors
        const name = 
          document.querySelector('.product-title, .product-name, h1')?.textContent?.trim() ||
          getMetaContent('og:title') ||
          document.title;

        const priceElement = document.querySelector(
          '.price, .product-price, [data-price], .amount, .cost, .money'
        );
        const priceText = priceElement?.textContent?.trim() || 
          getMetaContent('product:price:amount');

        const skuElement = document.querySelector(
          '.sku, .product-sku, [data-sku], .model, .part-number'
        );
        const sku = skuElement?.textContent?.trim() || 
          getMetaContent('product:sku');

        const categoryElement = document.querySelector(
          '.breadcrumb, .category, .product-category'
        );
        const category = categoryElement?.textContent?.trim();

        return {
          name: name || 'Unknown Product',
          sku: sku,
          price: priceText,
          category: category,
        };
      });

      // Additional cheerio-based extraction as fallback
      const content = await page.content();
      const $ = cheerio.load(content);

      // Enhance with cheerio if needed
      if (!productData.name || productData.name === 'Unknown Product') {
        productData.name = $('h1, .product-title, .product-name').first().text().trim() || 
          $('title').text().trim();
      }

      if (!productData.price) {
        const priceSelectors = ['.price', '.product-price', '[data-price]', '.amount', '.cost'];
        for (const selector of priceSelectors) {
          const price = $(selector).first().text().trim();
          if (price && /\$[\d,.]/.test(price)) {
            productData.price = price;
            break;
          }
        }
      }

      const product = this.normalizeProduct(productData, productUrl);

      await this.delay();

      return {
        success: true,
        product,
      };

    } finally {
      await page.close();
    }
  }

  async crawlCategoryRecursively(
    startUrl: string,
    maxPages: number = 10
  ): Promise<string[]> {
    return logOperation(logger, 'crawl_category_recursive', async () => {
      const allProductUrls: string[] = [];
      let currentUrl: string | undefined = startUrl;
      let pageCount = 0;

      while (currentUrl && pageCount < maxPages) {
        const result = await this.crawlCategory(currentUrl);
        
        if (!result.success) {
          logger.error({ url: currentUrl, error: result.error }, 'Category crawl failed');
          break;
        }

        allProductUrls.push(...result.productUrls);
        currentUrl = result.nextPageUrl;
        pageCount++;

        logger.info({ 
          page: pageCount, 
          productsFound: result.productUrls.length,
          totalProducts: allProductUrls.length
        }, 'Crawled category page');
      }

      // Remove duplicates
      return Array.from(new Set(allProductUrls));
    }, { url: startUrl, maxPages });
  }

  async crawlAllProducts(categoryUrls: string[]): Promise<Product[]> {
    return logOperation(logger, 'crawl_all_products', async () => {
      await this.initialize();
      
      try {
        const allProducts: Product[] = [];
        
        for (const categoryUrl of categoryUrls) {
          logger.info({ categoryUrl }, 'Starting category crawl');
          
          const productUrls = await this.crawlCategoryRecursively(categoryUrl);
          logger.info({ 
            categoryUrl, 
            productCount: productUrls.length 
          }, 'Found products in category');
          
          for (const productUrl of productUrls) {
            const result = await this.crawlProduct(productUrl);
            
            if (result.success && result.product) {
              allProducts.push(result.product);
              logger.debug({ 
                productId: result.product.id,
                name: result.product.name 
              }, 'Crawled product');
            } else {
              logger.warn({ 
                productUrl, 
                error: result.error 
              }, 'Failed to crawl product');
            }
          }
        }
        
        return allProducts;
        
      } finally {
        await this.close();
      }
    }, { categoryCount: categoryUrls.length });
  }
}

export const crawler = new SignatureSolarCrawler();