import * as cheerio from 'cheerio';
import { createLogger, logOperation } from './logger';
import { robotsChecker } from './robots-checker';
import { imageStorage } from './image-storage';
import { imageSearch } from './image-search';
import type {
  Product,
  CrawlResult,
  CategoryCrawlResult,
  CrawlerConfig,
  ProductImage
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
  private config: CrawlerConfig;
  private baseUrl = 'https://signaturesolar.com';

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    // No browser initialization needed for HTTP client
    logger.info('Crawler initialized with HTTP client (no browser required)');
  }

  async close(): Promise<void> {
    // No browser to close
    logger.info('Crawler cleanup complete');
  }

  private async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
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
      images: [], // Will be populated by image extraction
      primaryImageUrl: undefined, // Will be set after images are processed
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

  private extractDetailedProductInfo($: cheerio.CheerioAPI, basicData: any) {
    const details: any = {};

    // Extract description
    const descriptionSelectors = [
      '.product-description',
      '.description',
      '[itemprop="description"]',
      '.product-details',
      '.overview',
      '#description',
      '.tab-content',
      '.product-info'
    ];

    for (const selector of descriptionSelectors) {
      const desc = $(selector).first().text().trim();
      if (desc && desc.length > 50) {
        details.description = desc;
        details.shortDescription = desc.substring(0, 200) + (desc.length > 200 ? '...' : '');
        break;
      }
    }

    // Extract specifications from tables
    const specs: Record<string, string> = {};
    $('table').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td, th');
        if (cells.length >= 2) {
          const key = $(cells[0]).text().trim();
          const value = $(cells[1]).text().trim();
          if (key && value) {
            specs[key] = value;

            // Extract specific fields
            if (key.toLowerCase().includes('dimension')) {
              details.dimensions = value;
            } else if (key.toLowerCase().includes('weight')) {
              details.weight = value;
            } else if (key.toLowerCase().includes('warranty')) {
              details.warranty = value;
            } else if (key.toLowerCase().includes('power') || key.toLowerCase().includes('watt')) {
              details.powerRating = value;
            } else if (key.toLowerCase().includes('voltage') || key.toLowerCase().includes('volt')) {
              details.voltage = value;
            } else if (key.toLowerCase().includes('efficiency')) {
              details.efficiency = value;
            }
          }
        }
      });
    });

    if (Object.keys(specs).length > 0) {
      details.specifications = specs;
    }

    // Extract features from bullet points/lists
    const features: string[] = [];
    $('.features ul li, .product-features li, ul.features li, [class*="feature"] li').each((_, li) => {
      const feature = $(li).text().trim();
      if (feature && feature.length > 5) {
        features.push(feature);
      }
    });

    if (features.length > 0) {
      details.features = features;
    }

    // Extract warranty if not found in specs
    if (!details.warranty) {
      const warrantySelectors = ['.warranty', '[class*="warranty"]', '[data-warranty]'];
      for (const selector of warrantySelectors) {
        const warranty = $(selector).first().text().trim();
        if (warranty && warranty.length > 0 && warranty.length < 200) {
          details.warranty = warranty;
          break;
        }
      }
    }

    // Extract certifications
    const certifications: string[] = [];
    $('[class*="certification"], [class*="certified"], .badges').find('img, span, div').each((_, el) => {
      const cert = $(el).attr('alt') || $(el).attr('title') || $(el).text().trim();
      if (cert && (cert.includes('UL') || cert.includes('CE') || cert.includes('CSA') || cert.includes('ETL'))) {
        certifications.push(cert);
      }
    });

    if (certifications.length > 0) {
      details.certifications = certifications;
    }

    return details;
  }

  private extractProductImagesFromHtml($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const urls: string[] = [];

    // Strategy 1: Product gallery images
    const gallerySelectors = [
      '.product-gallery img[src]',
      '.product-images img[src]',
      '.product-image img[src]',
      '.woocommerce-product-gallery img[src]',
      '.product-photos img[src]',
      '.main-image img[src]',
      '.product-slider img[src]'
    ];

    for (const selector of gallerySelectors) {
      $(selector).each((_, img) => {
        const src = $(img).attr('src');
        if (src && !urls.includes(src)) {
          urls.push(src);
        }
      });
    }

    // Strategy 2: Structured data images
    try {
      const jsonLd = $('script[type="application/ld+json"]').first();
      if (jsonLd.length > 0) {
        const data = JSON.parse(jsonLd.html() || '');
        if (data['@type'] === 'Product') {
          const images = data.image || [];
          const imageArray = Array.isArray(images) ? images : [images];
          imageArray.forEach((img: any) => {
            const src = typeof img === 'string' ? img : img?.url;
            if (src && !urls.includes(src)) {
              urls.push(src);
            }
          });
        }
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }

    // Strategy 3: Meta property images
    const ogImage = $('meta[property="og:image"]').first().attr('content');
    if (ogImage && !urls.includes(ogImage)) {
      urls.push(ogImage);
    }

    // Strategy 4: Generic product images (last resort)
    if (urls.length === 0) {
      const fallbackSelectors = [
        'img[alt*="product"]',
        'img[alt*="Product"]',
        'img[src*="product"]',
        'img[class*="product"]',
        '.content img[src]'
      ];

      for (const selector of fallbackSelectors) {
        $(selector).each((_, img) => {
          const src = $(img).attr('src');
          const alt = $(img).attr('alt') || '';
          // Only include if it looks like a product image
          if (src && (alt.toLowerCase().includes('product') || src.includes('product'))) {
            if (!urls.includes(src)) {
              urls.push(src);
            }
          }
        });
        if (urls.length > 0) break; // Stop at first successful strategy
      }
    }

    // Filter and normalize URLs
    return urls
      .filter(url => {
        // Filter out obvious non-product images
        const lowercaseUrl = url.toLowerCase();
        return !lowercaseUrl.includes('logo') &&
          !lowercaseUrl.includes('icon') &&
          !lowercaseUrl.includes('badge') &&
          !lowercaseUrl.includes('banner') &&
          !lowercaseUrl.includes('social') &&
          lowercaseUrl.match(/\.(jpg|jpeg|png|webp|avif)(\?|$)/i);
      })
      .map(url => {
        // Normalize relative URLs
        if (url.startsWith('//')) {
          return `https:${url}`;
        } else if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        return url;
      })
      .slice(0, 5); // Limit to 5 images max
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

      const html = await this.fetchPage(categoryUrl);
      const $ = cheerio.load(html);

      const productUrls: string[] = [];

      // Strategy 1: Extract product data from BigCommerce JavaScript array
      // Signature Solar (BigCommerce) embeds product data in _smbdg_products variable
      const scriptTags = $('script').toArray();

      for (const scriptTag of scriptTags) {
        const scriptContent = $(scriptTag).html() || '';

        // Look for _smbdg_products variable
        if (scriptContent.includes('_smbdg_products')) {
          try {
            // Extract the array content
            const match = scriptContent.match(/var\s+_smbdg_products\s*=\s*(\[[\s\S]*?\]);/);

            if (match && match[1]) {
              // Parse the JavaScript array as JSON
              const productsData = JSON.parse(match[1]);

              logger.info({
                categoryUrl,
                productsInJsArray: productsData.length
              }, 'Found products in BigCommerce JavaScript array');

              // Extract product URLs from the data
              for (const product of productsData) {
                // Skip empty objects and products without handle
                if (!product || !product.handle || typeof product.handle !== 'string') {
                  continue;
                }

                let productUrl = product.handle;

                // Normalize to absolute URL
                if (!productUrl.startsWith('http')) {
                  productUrl = `https://signaturesolar.com${productUrl.startsWith('/') ? '' : '/'}${productUrl}`;
                }

                if (!productUrls.includes(productUrl)) {
                  productUrls.push(productUrl);
                }
              }

              logger.info({
                categoryUrl,
                extractedUrls: productUrls.length
              }, 'Extracted product URLs from JavaScript data');

              break; // Found the data, no need to check more script tags
            }
          } catch (error) {
            logger.warn({
              categoryUrl,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, 'Failed to parse _smbdg_products JavaScript array');
          }
        }
      }

      // Strategy 2: Fallback - Look for product links in HTML if JavaScript parsing failed
      if (productUrls.length === 0) {
        logger.warn({ categoryUrl }, 'JavaScript extraction failed, trying HTML selectors');

        const selectors = [
          'a[href*="signaturesolar.com/"][href*="-"]', // Product URLs usually have dashes
          '.card a[href]',
          '.product a[href]',
        ];

        for (const selector of selectors) {
          $(selector).each((_, el) => {
            let href = $(el).attr('href');

            if (href) {
              // Normalize to absolute URL
              if (href.startsWith('/')) {
                href = `https://signaturesolar.com${href}`;
              }

              // Basic validation - product pages are not category pages
              if (
                href.includes('signaturesolar.com') &&
                !href.includes('/all-products/') &&
                !href.includes('/shop-all/') &&
                !href.includes('/cart') &&
                !href.includes('/checkout') &&
                href.length > 30 // Product URLs are reasonably long
              ) {
                if (!productUrls.includes(href)) {
                  productUrls.push(href);
                }
              }
            }
          });

          if (productUrls.length > 0) {
            logger.info({
              categoryUrl,
              productsFound: productUrls.length
            }, 'Found products via HTML selector fallback');
            break;
          }
        }
      }

      // Look for next page
      let nextPageUrl: string | undefined;
      const nextLink = $('a[rel="next"], .next-page, .pagination-next').first();
      if (nextLink.length > 0) {
        const href = nextLink.attr('href');
        if (href) {
          nextPageUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).href;
        }
      }

      // Remove duplicates and normalize URLs
      const uniqueUrls = Array.from(new Set(productUrls))
        .filter(url => url && url.length > 0) // Remove empty URLs
        .map(url => url.startsWith('http') ? url : new URL(url, this.baseUrl).href);

      await this.delay();

      return {
        success: true,
        productUrls: uniqueUrls,
        nextPageUrl,
      };
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
    try {
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

      const html = await this.fetchPage(productUrl);
      const $ = cheerio.load(html);

    let productData: any = {};

    // Strategy 1: Structured data (JSON-LD)
    const jsonLd = $('script[type="application/ld+json"]').first();
    if (jsonLd.length > 0) {
      try {
        const data = JSON.parse(jsonLd.html() || '');
        if (data['@type'] === 'Product') {
          productData = {
            name: data.name,
            sku: data.sku,
            price: data.offers?.price || data.offers?.[0]?.price,
            category: data.category,
            description: data.description,
            brand: data.brand?.name,
            images: Array.isArray(data.image) ? data.image : (data.image ? [data.image] : []),
          };
        }
      } catch (e) {
        // Fallback to DOM selectors
        logger.debug('Failed to parse JSON-LD, falling back to selectors');
      }
    }

    // Strategy 2: Meta properties
    const getMetaContent = (property: string): string | null => {
      const meta = $(`meta[property="${property}"], meta[name="${property}"]`).first();
      return meta.attr('content') || null;
    };

    // Strategy 3: DOM selectors
    if (!productData.name) {
      productData.name =
        $('.product-title, .product-name, h1').first().text().trim() ||
        getMetaContent('og:title') ||
        $('title').text().trim() ||
        'Unknown Product';
    }

    if (!productData.price) {
      // Strategy: Find actual price elements, avoiding containers
      // Prefer sale price (without --non-sale class) over original price

      // First, look for sale/current price (span.price without --non-sale)
      const salePriceElements = $('span.price').not('.price--non-sale').toArray();

      for (const el of salePriceElements) {
        const $el = $(el);

        // Skip if this element contains other .price elements (it's a container)
        if ($el.find('.price').length > 0) {
          continue;
        }

        const priceText = $el.text().trim();

        // Validate it looks like a single price (format: $X,XXX.XX)
        if (priceText && /^\$[\d,]+\.[\d]{2}$/.test(priceText)) {
          productData.price = priceText;
          break;
        }
      }

      // If no sale price, look for any span.price (including --non-sale)
      if (!productData.price) {
        const allPriceElements = $('span.price').toArray();

        for (const el of allPriceElements) {
          const $el = $(el);

          // Skip if this element contains other .price elements (it's a container)
          if ($el.find('.price').length > 0) {
            continue;
          }

          const priceText = $el.text().trim();

          // Validate it looks like a single price (format: $X,XXX.XX)
          if (priceText && /^\$[\d,]+\.[\d]{2}$/.test(priceText)) {
            productData.price = priceText;
            break;
          }
        }
      }

      // Fallback to other selectors if span.price didn't work
      if (!productData.price) {
        const priceSelectors = ['.product-price', '[data-price]', '.amount'];
        for (const selector of priceSelectors) {
          const price = $(selector).first().text().trim();
          if (price && /^\$[\d,]+\.[\d]{2}$/.test(price)) {
            productData.price = price;
            break;
          }
        }
      }

      // Final fallback to meta tag
      if (!productData.price) {
        productData.price = getMetaContent('product:price:amount');
      }
    }

    if (!productData.sku) {
      const skuSelectors = ['.sku', '.product-sku', '[data-sku]', '.model', '.part-number'];
      for (const selector of skuSelectors) {
        const sku = $(selector).first().text().trim();
        if (sku) {
          productData.sku = sku;
          break;
        }
      }
      if (!productData.sku) {
        productData.sku = getMetaContent('product:sku');
      }
    }

    if (!productData.category) {
      productData.category = $('.breadcrumb, .category, .product-category').first().text().trim();
    }

    // Extract detailed product information using Cheerio
    const detailedInfo = this.extractDetailedProductInfo($, productData);

    const product = this.normalizeProduct({
      ...productData,
      ...detailedInfo,
    }, productUrl);

    // Extract and download product images
    try {
      let imageUrls = this.extractProductImagesFromHtml($, this.baseUrl);

      // Fallback: If none found on page, use Bing Image Search based on product name and vendor
      if (imageUrls.length === 0 && imageSearch.isConfigured()) {
        const query = `${product.name} ${product.sku ? product.sku : ''} Signature Solar`.trim();
        logger.info({ query }, 'No images found on page, using web image search');
        const fallbackUrls = await imageSearch.searchProductImages(query, { count: 3 });
        imageUrls = fallbackUrls;
      }

      if (imageUrls.length > 0) {
        logger.debug({
          productId: product.id,
          imageCount: imageUrls.length
        }, 'Found product images');

        // Initialize image storage if not already done
        await imageStorage.initialize();

        // Download and store images
        const images = await imageStorage.downloadProductImages(
          product.id,
          imageUrls,
          product.name
        );

        // Update product with image data
        product.images = images;
        product.primaryImageUrl = images.find(img => img.isPrimary)?.localPath;

        logger.debug({
          productId: product.id,
          savedImages: images.length,
          primaryImage: product.primaryImageUrl
        }, 'Product images processed');
      }
    } catch (error) {
        logger.warn({ 
          productId: product.id,
          error: error instanceof Error ? error.message : String(error)
        }, 'Failed to process product images');
        // Continue without images - don't fail the entire product crawl
      }

      await this.delay();

      return {
        success: true,
        product,
      };
    } catch (error) {
      logger.error({ productUrl, error }, 'Failed to crawl product');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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