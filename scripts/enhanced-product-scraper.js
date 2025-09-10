const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Enhanced product scraper that visits individual product pages
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const productData = await page.evaluate(() => {
      // Extract detailed product information
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
        galleryImages: [],
        
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
        
        // SEO and metadata
        metaTitle: null,
        metaDescription: null,
        breadcrumbs: [],
        
        // Additional data
        tags: [],
        categories: [],
        relatedProducts: [],
        reviews: {
          averageRating: null,
          totalReviews: 0,
          reviews: []
        }
      };
      
      // Extract product name
      const nameSelectors = [
        'h1.product-title',
        'h1[data-testid="product-title"]',
        '.product-name h1',
        '.product-header h1',
        'h1',
        '.product-title',
        '.product-name'
      ];
      
      for (const selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.name = element.textContent.trim();
          break;
        }
      }
      
      // Extract SKU
      const skuSelectors = [
        '.product-sku',
        '.sku',
        '[data-testid="sku"]',
        '.product-code',
        '.item-number'
      ];
      
      for (const selector of skuSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.sku = element.textContent.trim().replace(/SKU:\s*/i, '');
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
        '[data-testid*="price"]'
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
        '.product-content'
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
        '.product-intro'
      ];
      
      for (const selector of shortDescSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.shortDescription = element.textContent.trim();
          break;
        }
      }
      
      // Extract images
      const imageSelectors = [
        '.product-gallery img',
        '.product-images img',
        '.gallery img',
        '.product-photos img',
        '.product-image img',
        '.main-image img',
        'img[alt*="product"]',
        'img[src*="product"]'
      ];
      
      const imageElements = document.querySelectorAll('img');
      const images = new Set();
      
      imageElements.forEach(img => {
        if (img.src && !img.src.includes('data:') && !img.src.includes('placeholder')) {
          // Clean up image URLs
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
      
      data.images = Array.from(images);
      data.primaryImageUrl = data.images[0] || null;
      
      // Extract specifications from tables
      const specTables = document.querySelectorAll('table, .specifications, .product-specs, .tech-specs');
      specTables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const key = cells[0].textContent.trim();
            const value = cells[1].textContent.trim();
            if (key && value) {
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
        '.key-features ul li'
      ];
      
      featureSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const feature = element.textContent.trim();
          if (feature && !data.features.includes(feature)) {
            data.features.push(feature);
          }
        });
      });
      
      // Extract technical specifications
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
          if (category && !data.categories.includes(category)) {
            data.categories.push(category);
          }
        });
      });
      
      // Extract meta information
      const metaTitle = document.querySelector('title');
      if (metaTitle) {
        data.metaTitle = metaTitle.textContent.trim();
      }
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        data.metaDescription = metaDescription.getAttribute('content');
      }
      
      // Extract stock information
      const stockSelectors = [
        '.stock-status',
        '.availability',
        '.in-stock',
        '.out-of-stock',
        '.product-availability'
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

async function enhancedCrawl() {
  console.log('Starting enhanced Signature Solar crawl...');
  
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
    
    // First, get the basic product list
    const basicProducts = await page.evaluate(() => {
      const products = [];
      const elements = document.querySelectorAll('div, article, section');
      
      elements.forEach((element, index) => {
        try {
          const nameElement = element.querySelector('h3, h4, .product-title, .product-name');
          const name = nameElement ? nameElement.textContent.trim() : null;
          
          const imgElement = element.querySelector('img');
          const imageUrl = imgElement ? imgElement.src || imgElement.getAttribute('data-src') : null;
          
          const linkElement = element.querySelector('a[href*="signaturesolar.com"]');
          const productUrl = linkElement ? linkElement.href : null;
          
          if (name && imageUrl && productUrl) {
            products.push({
              id: `ss-${index + 1}`,
              name,
              url: productUrl,
              primaryImageUrl: imageUrl,
              basicData: true
            });
          }
        } catch (error) {
          // Skip invalid elements
        }
      });
      
      return products;
    });
    
    console.log(`Found ${basicProducts.length} basic products`);
    
    // Step 2: Visit each product page for detailed data
    console.log('Step 2: Scraping detailed product information...');
    const detailedProducts = [];
    
    for (let i = 0; i < Math.min(basicProducts.length, 20); i++) { // Limit to first 20 for testing
      const product = basicProducts[i];
      console.log(`Processing ${i + 1}/${Math.min(basicProducts.length, 20)}: ${product.name}`);
      
      const detailedData = await scrapeProductDetails(product.url, browser);
      
      if (detailedData && detailedData.name) {
        const enhancedProduct = {
          id: product.id,
          name: detailedData.name || product.name,
          sku: detailedData.sku || `SS-${i + 1}`,
          vendor: 'SignatureSolar',
          category: detailedData.categories[0] || 'Solar Equipment',
          price: detailedData.price,
          currency: detailedData.currency,
          url: product.url,
          primaryImageUrl: detailedData.primaryImageUrl || product.primaryImageUrl,
          images: detailedData.images || [product.primaryImageUrl],
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
          metaTitle: detailedData.metaTitle,
          metaDescription: detailedData.metaDescription,
          categories: detailedData.categories,
          tags: detailedData.tags,
          reviews: detailedData.reviews,
          isActive: true,
          lastUpdated: new Date().toISOString()
        };
        
        detailedProducts.push(enhancedProduct);
      }
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save detailed products
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'enhanced-signature-solar-products.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(detailedProducts, null, 2));
    
    console.log(`\nEnhanced crawl completed!`);
    console.log(`Saved ${detailedProducts.length} detailed products to ${outputPath}`);
    
    // Show sample of enhanced data
    console.log('\nSample enhanced product data:');
    if (detailedProducts.length > 0) {
      const sample = detailedProducts[0];
      console.log(`Name: ${sample.name}`);
      console.log(`SKU: ${sample.sku}`);
      console.log(`Price: $${sample.price}`);
      console.log(`Images: ${sample.images.length}`);
      console.log(`Features: ${sample.features.length}`);
      console.log(`Specifications: ${Object.keys(sample.specifications).length}`);
      console.log(`Description: ${sample.description ? sample.description.substring(0, 100) + '...' : 'N/A'}`);
    }
    
    return detailedProducts;
    
  } catch (error) {
    console.error('Error during enhanced crawl:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the enhanced crawl
enhancedCrawl()
  .then(products => {
    console.log(`\nEnhanced crawl completed successfully! Found ${products.length} detailed products.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Enhanced crawl failed:', error);
    process.exit(1);
  });
