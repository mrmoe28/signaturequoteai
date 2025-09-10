const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Improved product scraper with better filtering and data extraction
async function scrapeProductDetails(productUrl, browser) {
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log(`Scraping product details from: ${productUrl}`);
    
    await page.goto(productUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const productData = await page.evaluate(() => {
      const data = {
        // Basic info
        name: null,
        sku: null,
        price: null,
        currency: 'USD',
        description: null,
        shortDescription: null,
        
        // Images
        primaryImageUrl: null,
        images: [],
        
        // Specifications
        specifications: {},
        features: [],
        dimensions: null,
        weight: null,
        warranty: null,
        
        // Technical details
        powerRating: null,
        voltage: null,
        efficiency: null,
        certifications: [],
        
        // Availability
        inStock: true,
        stockQuantity: null,
        availability: 'In Stock',
        
        // Additional data
        tags: [],
        categories: [],
        reviews: {
          averageRating: null,
          totalReviews: 0,
          reviews: []
        }
      };
      
      // Extract product name - try multiple selectors
      const nameSelectors = [
        'h1.product-title',
        'h1[data-testid="product-title"]',
        '.product-name h1',
        '.product-header h1',
        'h1',
        '.product-title',
        '.product-name',
        '.productTitle',
        '.product-name-title'
      ];
      
      for (const selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim() && !element.textContent.includes('New Arrivals')) {
          data.name = element.textContent.trim();
          break;
        }
      }
      
      // Skip if this doesn't look like a product page
      if (!data.name || data.name.includes('New Arrivals') || data.name.includes('All Products')) {
        return null;
      }
      
      // Extract SKU
      const skuSelectors = [
        '.product-sku',
        '.sku',
        '[data-testid="sku"]',
        '.product-code',
        '.item-number',
        '.product-id',
        '.model-number'
      ];
      
      for (const selector of skuSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.sku = element.textContent.trim().replace(/SKU:\s*/i, '').replace(/Model:\s*/i, '');
          break;
        }
      }
      
      // Extract price with multiple selectors
      const priceSelectors = [
        '.price-current',
        '.price-now',
        '.sale-price',
        '.regular-price',
        '.price-value',
        '.price-amount',
        '.product-price',
        '.price',
        '[data-testid*="price"]',
        '.price-box .price',
        '.price-container .price'
      ];
      
      for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          const priceText = element.textContent.trim();
          const priceMatch = priceText.match(/\$?([0-9,]+\.?[0-9]*)/);
          if (priceMatch) {
            data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
            break;
          }
        }
      }
      
      // Extract description
      const descriptionSelectors = [
        '.product-description',
        '.product-summary',
        '.product-details',
        '.description',
        '.product-info',
        '.product-content',
        '.product-overview',
        '.product-detail-description'
      ];
      
      for (const selector of descriptionSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.description = element.textContent.trim();
          break;
        }
      }
      
      // Extract short description
      const shortDescSelectors = [
        '.product-short-description',
        '.product-excerpt',
        '.product-summary p',
        '.product-intro',
        '.product-brief'
      ];
      
      for (const selector of shortDescSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.shortDescription = element.textContent.trim();
          break;
        }
      }
      
      // Extract images - focus on product images
      const imageSelectors = [
        '.product-gallery img',
        '.product-images img',
        '.gallery img',
        '.product-photos img',
        '.product-image img',
        '.main-image img',
        '.product-main-image img',
        '.hero-image img'
      ];
      
      const images = new Set();
      
      // Try specific product image selectors first
      for (const selector of imageSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(img => {
          if (img.src && !img.src.includes('data:') && !img.src.includes('placeholder')) {
            let imageUrl = img.src;
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            }
            if (imageUrl.includes('?')) {
              imageUrl = imageUrl.split('?')[0];
            }
            images.add(imageUrl);
          }
        });
      }
      
      // Fallback to all images if no product images found
      if (images.size === 0) {
        const allImages = document.querySelectorAll('img');
        allImages.forEach(img => {
          if (img.src && 
              !img.src.includes('data:') && 
              !img.src.includes('placeholder') &&
              !img.src.includes('logo') &&
              !img.src.includes('icon') &&
              img.src.includes('product')) {
            let imageUrl = img.src;
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            }
            if (imageUrl.includes('?')) {
              imageUrl = imageUrl.split('?')[0];
            }
            images.add(imageUrl);
          }
        });
      }
      
      data.images = Array.from(images);
      data.primaryImageUrl = data.images[0] || null;
      
      // Extract specifications from tables
      const specTables = document.querySelectorAll('table, .specifications, .product-specs, .tech-specs, .spec-table');
      specTables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const key = cells[0].textContent.trim();
            const value = cells[1].textContent.trim();
            if (key && value && key !== value) {
              data.specifications[key] = value;
            }
          }
        });
      });
      
      // Extract features from lists
      const featureSelectors = [
        '.product-features ul li',
        '.features ul li',
        '.product-benefits ul li',
        '.key-features ul li',
        '.product-highlights ul li',
        '.feature-list li'
      ];
      
      featureSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const feature = element.textContent.trim();
          if (feature && !data.features.includes(feature) && feature.length > 10) {
            data.features.push(feature);
          }
        });
      });
      
      // Extract technical specifications from page text
      const pageText = document.body.textContent || '';
      
      // Power rating
      const powerMatch = pageText.match(/(\d+)\s*W(?:atts?)?/i);
      if (powerMatch) {
        data.powerRating = powerMatch[1] + 'W';
      }
      
      // Voltage
      const voltageMatch = pageText.match(/(\d+)\s*V(?:olts?)?/i);
      if (voltageMatch) {
        data.voltage = voltageMatch[1] + 'V';
      }
      
      // Efficiency
      const efficiencyMatch = pageText.match(/(\d+\.?\d*)\s*%?\s*efficiency/i);
      if (efficiencyMatch) {
        data.efficiency = efficiencyMatch[1] + '%';
      }
      
      // Weight
      const weightMatch = pageText.match(/(\d+\.?\d*)\s*(?:lbs?|pounds?|kg|kilograms?)/i);
      if (weightMatch) {
        data.weight = weightMatch[0];
      }
      
      // Dimensions
      const dimensionMatch = pageText.match(/(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*(?:in|inches?|cm|centimeters?)/i);
      if (dimensionMatch) {
        data.dimensions = dimensionMatch[0];
      }
      
      // Warranty
      const warrantyMatch = pageText.match(/(\d+)\s*(?:year|yr)s?\s*warranty/i);
      if (warrantyMatch) {
        data.warranty = warrantyMatch[0];
      }
      
      // Extract categories from breadcrumbs
      const breadcrumbSelectors = [
        '.breadcrumbs a',
        '.breadcrumb a',
        '.nav-breadcrumb a',
        '.breadcrumb-nav a'
      ];
      
      breadcrumbSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const category = element.textContent.trim();
          if (category && !data.categories.includes(category) && category !== 'Home') {
            data.categories.push(category);
          }
        });
      });
      
      // Extract stock information
      const stockSelectors = [
        '.stock-status',
        '.availability',
        '.in-stock',
        '.out-of-stock',
        '.product-availability',
        '.inventory-status'
      ];
      
      for (const selector of stockSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const stockText = element.textContent.trim().toLowerCase();
          data.availability = stockText;
          data.inStock = !stockText.includes('out') && !stockText.includes('unavailable');
          break;
        }
      }
      
      return data;
    });
    
    await page.close();
    return productData;
    
  } catch (error) {
    console.error(`Error scraping product ${productUrl}:`, error);
    return null;
  }
}

async function improvedCrawl() {
  console.log('Starting improved Signature Solar crawl...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Step 1: Getting product list from main page...');
    await page.goto('https://signaturesolar.com/all-products/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get product URLs from the main page
    const productUrls = await page.evaluate(() => {
      const urls = new Set();
      
      // Look for product links
      const linkSelectors = [
        'a[href*="/products/"]',
        'a[href*="/product/"]',
        'a[href*="signaturesolar.com"]'
      ];
      
      linkSelectors.forEach(selector => {
        const links = document.querySelectorAll(selector);
        links.forEach(link => {
          const href = link.href;
          if (href && 
              href.includes('signaturesolar.com') && 
              !href.includes('/all-products/') &&
              !href.includes('/categories/') &&
              !href.includes('/search') &&
              !href.includes('/account') &&
              !href.includes('/cart') &&
              !href.includes('/checkout') &&
              href !== 'https://signaturesolar.com/') {
            urls.add(href);
          }
        });
      });
      
      return Array.from(urls);
    });
    
    console.log(`Found ${productUrls.length} product URLs`);
    
    // Step 2: Visit each product page for detailed data
    console.log('Step 2: Scraping detailed product information...');
    const detailedProducts = [];
    
    for (let i = 0; i < Math.min(productUrls.length, 15); i++) { // Limit to first 15 for testing
      const productUrl = productUrls[i];
      console.log(`Processing ${i + 1}/${Math.min(productUrls.length, 15)}: ${productUrl}`);
      
      const detailedData = await scrapeProductDetails(productUrl, browser);
      
      if (detailedData && detailedData.name) {
        const enhancedProduct = {
          id: `ss-${i + 1}`,
          name: detailedData.name,
          sku: detailedData.sku || `SS-${i + 1}`,
          vendor: 'SignatureSolar',
          category: detailedData.categories[0] || 'Solar Equipment',
          price: detailedData.price,
          currency: detailedData.currency,
          url: productUrl,
          primaryImageUrl: detailedData.primaryImageUrl,
          images: detailedData.images || [],
          description: detailedData.description,
          shortDescription: detailedData.shortDescription,
          specifications: detailedData.specifications,
          features: detailedData.features,
          dimensions: detailedData.dimensions,
          weight: detailedData.weight,
          warranty: detailedData.warranty,
          powerRating: detailedData.powerRating,
          voltage: detailedData.voltage,
          efficiency: detailedData.efficiency,
          certifications: detailedData.certifications,
          inStock: detailedData.inStock,
          availability: detailedData.availability,
          categories: detailedData.categories,
          tags: detailedData.tags,
          reviews: detailedData.reviews,
          isActive: true,
          lastUpdated: new Date().toISOString()
        };
        
        detailedProducts.push(enhancedProduct);
        console.log(`  ✓ Extracted: ${enhancedProduct.name} - $${enhancedProduct.price || 'N/A'} - ${enhancedProduct.images.length} images`);
      } else {
        console.log(`  ✗ Skipped: No valid product data found`);
      }
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save detailed products
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'improved-signature-solar-products.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(detailedProducts, null, 2));
    
    console.log(`\nImproved crawl completed!`);
    console.log(`Saved ${detailedProducts.length} detailed products to ${outputPath}`);
    
    // Show sample of enhanced data
    console.log('\nSample enhanced product data:');
    if (detailedProducts.length > 0) {
      const sample = detailedProducts[0];
      console.log(`Name: ${sample.name}`);
      console.log(`SKU: ${sample.sku}`);
      console.log(`Price: $${sample.price || 'N/A'}`);
      console.log(`Images: ${sample.images.length}`);
      console.log(`Features: ${sample.features.length}`);
      console.log(`Specifications: ${Object.keys(sample.specifications).length}`);
      console.log(`Description: ${sample.description ? sample.description.substring(0, 100) + '...' : 'N/A'}`);
    }
    
    return detailedProducts;
    
  } catch (error) {
    console.error('Error during improved crawl:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the improved crawl
improvedCrawl()
  .then(products => {
    console.log(`\nImproved crawl completed successfully! Found ${products.length} detailed products.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Improved crawl failed:', error);
    process.exit(1);
  });
