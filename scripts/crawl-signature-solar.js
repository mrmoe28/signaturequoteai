const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function crawlSignatureSolar() {
  console.log('Starting Signature Solar crawl...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to Signature Solar products page...');
    await page.goto('https://signaturesolar.com/all-products/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load and get page content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Extracting product data...');
    
    // First, let's see what selectors are available
    const pageInfo = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const selectors = new Set();
      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls.includes('product') || cls.includes('item') || cls.includes('card')) {
              selectors.add('.' + cls);
            }
          });
        }
      });
      return Array.from(selectors).slice(0, 20);
    });
    
    console.log('Available selectors:', pageInfo);
    
    // Extract product information from the page
    const products = await page.evaluate(() => {
      // Try multiple possible selectors for products
      const possibleSelectors = [
        '.product-item',
        '.product-card', 
        '.grid-item',
        '.product',
        '[data-testid*="product"]',
        '.item',
        '.card',
        'article',
        '.product-tile',
        '.product-grid-item'
      ];
      
      let productElements = [];
      for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          productElements = elements;
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          break;
        }
      }
      
      // If no specific selectors work, try to find elements with images and text
      if (productElements.length === 0) {
        productElements = document.querySelectorAll('div, article, section');
        console.log(`Fallback: found ${productElements.length} potential elements`);
      }
      
      const results = [];
      
      productElements.forEach((element, index) => {
        try {
          // Try to find product name
          const nameElement = element.querySelector('h3, h4, .product-title, .product-name, [data-testid*="title"]');
          const name = nameElement ? nameElement.textContent.trim() : null;
          
          // Try to find product image
          const imgElement = element.querySelector('img');
          const imageUrl = imgElement ? imgElement.src || imgElement.getAttribute('data-src') : null;
          
          // Try to find price with multiple selectors
          const priceSelectors = [
            '.price',
            '.product-price', 
            '[data-testid*="price"]',
            '.price-current',
            '.price-now',
            '.sale-price',
            '.regular-price',
            '.price-value',
            '.price-amount',
            '.price .sr-only',
            '.price .visually-hidden'
          ];
          
          let priceElement = null;
          let priceText = null;
          
          for (const selector of priceSelectors) {
            priceElement = element.querySelector(selector);
            if (priceElement) {
              priceText = priceElement.textContent.trim();
              // Remove currency symbols and clean up
              priceText = priceText.replace(/[$,\s]/g, '');
              if (priceText && !isNaN(parseFloat(priceText))) {
                break;
              }
            }
          }

          // Fallback: scan card text for first $price pattern
          if (!priceText) {
            const cardText = (element.innerText || '').replace(/\s+/g, ' ').trim();
            const priceMatch = cardText.match(/\$\s*[0-9][0-9,]*(?:\.[0-9]{2})?/);
            if (priceMatch) {
              priceText = priceMatch[0].replace(/[$,\s]/g, '');
            }
          }
          
          // Try to find SKU
          const skuElement = element.querySelector('.sku, .product-sku, [data-testid*="sku"]');
          const sku = skuElement ? skuElement.textContent.trim() : null;
          
          // Try to find product link with multiple selectors
          const linkSelectors = [
            'a[href*="/products/"]',
            'a[href*="/product/"]',
            'a[href*="signaturesolar.com"]',
            'a[href*=".html"]',
            'a[href*=".htm"]'
          ];
          
          let linkElement = null;
          let productUrl = null;
          
          for (const selector of linkSelectors) {
            linkElement = element.querySelector(selector);
            if (linkElement) {
              productUrl = linkElement.href;
              if (productUrl && productUrl.includes('signaturesolar.com')) {
                console.log(`Found product URL: ${productUrl}`);
                break;
              }
            }
          }
          
          // Also try to find link in parent elements
          if (!productUrl) {
            let parent = element.parentElement;
            while (parent && parent !== document.body) {
              const parentLink = parent.querySelector('a[href*="signaturesolar.com"]');
              if (parentLink) {
                productUrl = parentLink.href;
                console.log(`Found product URL in parent: ${productUrl}`);
                break;
              }
              parent = parent.parentElement;
            }
          }
          
          // Try to find product description
          const descriptionElement = element.querySelector('.product-description, .product-summary, .product-details, .description');
          const description = descriptionElement ? descriptionElement.textContent.trim().substring(0, 200) : null;
          
          if (name && imageUrl) {
            results.push({
              id: `ss-${index + 1}`,
              name,
              sku: sku || `SS-${index + 1}`,
              vendor: 'SignatureSolar',
              category: 'Solar Equipment',
              price: priceText ? parseFloat(priceText) : null,
              currency: 'USD',
              url: productUrl,
              primaryImageUrl: imageUrl,
              images: [imageUrl],
              description: description,
              isActive: true,
              lastUpdated: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error processing product element:', error);
        }
      });
      
      return results;
    });
    
    console.log(`Found ${products.length} products with images`);
    
    // Save to file
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'signature-solar-products.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    
    console.log(`Saved ${products.length} products to ${outputPath}`);
    
    // Show sample products
    console.log('\nSample products found:');
    products.slice(0, 5).forEach(product => {
      console.log(`- ${product.name} (${product.sku}) - ${product.primaryImageUrl}`);
    });
    
    return products;
    
  } catch (error) {
    console.error('Error during crawl:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the crawl
crawlSignatureSolar()
  .then(products => {
    console.log(`\nCrawl completed successfully! Found ${products.length} products.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Crawl failed:', error);
    process.exit(1);
  });
