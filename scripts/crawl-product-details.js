const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function crawlProductDetails() {
  console.log('Starting detailed product crawl...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // First, get the list of products from our existing data
    const dataPath = path.join(__dirname, '..', 'public', 'data', 'signature-solar-products.json');
    if (!fs.existsSync(dataPath)) {
      console.log('No existing product data found. Run the main crawler first.');
      return;
    }
    
    const existingProducts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Found ${existingProducts.length} existing products to enhance`);
    
    const enhancedProducts = [];
    
    for (let i = 0; i < Math.min(existingProducts.length, 5); i++) { // Limit to first 5 for testing
      const product = existingProducts[i];
      console.log(`\nProcessing product ${i + 1}/${Math.min(existingProducts.length, 5)}: ${product.name}`);
      
      try {
        // Try to visit the product page if we have a URL
        if (product.url) {
          console.log(`  Visiting: ${product.url}`);
          await page.goto(product.url, { 
            waitUntil: 'networkidle2',
            timeout: 15000 
          });
          
          // Wait a bit for dynamic content
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Extract detailed information
          const productDetails = await page.evaluate(() => {
            // Try multiple price selectors
            const priceSelectors = [
              '.price-current',
              '.price-now',
              '.sale-price',
              '.regular-price',
              '.price-value',
              '.price-amount',
              '.price',
              '.product-price',
              '[data-testid*="price"]',
              '.price .sr-only',
              '.price .visually-hidden',
              '.price-current .sr-only',
              '.price-current .visually-hidden'
            ];
            
            let price = null;
            for (const selector of priceSelectors) {
              const priceElement = document.querySelector(selector);
              if (priceElement) {
                const priceText = priceElement.textContent.trim();
                const cleanPrice = priceText.replace(/[$,\s]/g, '');
                if (cleanPrice && !isNaN(parseFloat(cleanPrice))) {
                  price = parseFloat(cleanPrice);
                  console.log(`Found price: ${price} using selector: ${selector}`);
                  break;
                }
              }
            }
            
            // Try to find description
            const descriptionSelectors = [
              '.product-description',
              '.product-summary',
              '.product-details',
              '.description',
              '.product-overview',
              '.product-info',
              '.product-content',
              '.product-text',
              '.product-body'
            ];
            
            let description = null;
            for (const selector of descriptionSelectors) {
              const descElement = document.querySelector(selector);
              if (descElement) {
                description = descElement.textContent.trim().substring(0, 500);
                if (description.length > 50) {
                  console.log(`Found description using selector: ${selector}`);
                  break;
                }
              }
            }
            
            // Try to find specifications
            const specSelectors = [
              '.product-specifications',
              '.specifications',
              '.product-specs',
              '.specs',
              '.product-features',
              '.features'
            ];
            
            let specifications = null;
            for (const selector of specSelectors) {
              const specElement = document.querySelector(selector);
              if (specElement) {
                specifications = specElement.textContent.trim().substring(0, 1000);
                if (specifications.length > 100) {
                  console.log(`Found specifications using selector: ${selector}`);
                  break;
                }
              }
            }
            
            return {
              price,
              description,
              specifications
            };
          });
          
          // Update the product with new details
          const enhancedProduct = {
            ...product,
            price: productDetails.price || product.price,
            description: productDetails.description || product.description,
            specifications: productDetails.specifications
          };
          
          enhancedProducts.push(enhancedProduct);
          
          console.log(`  Enhanced: Price=${enhancedProduct.price}, Description=${enhancedProduct.description ? 'Yes' : 'No'}`);
          
        } else {
          console.log(`  No URL available, keeping original data`);
          enhancedProducts.push(product);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  Error processing product: ${error.message}`);
        enhancedProducts.push(product); // Keep original if enhancement fails
      }
    }
    
    // Save enhanced data
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'signature-solar-products.json');
    fs.writeFileSync(outputPath, JSON.stringify(enhancedProducts, null, 2));
    
    console.log(`\nEnhanced ${enhancedProducts.length} products and saved to ${outputPath}`);
    
    // Show summary
    const withPrices = enhancedProducts.filter(p => p.price !== null).length;
    const withDescriptions = enhancedProducts.filter(p => p.description).length;
    
    console.log(`\nSummary:`);
    console.log(`- Products with prices: ${withPrices}/${enhancedProducts.length}`);
    console.log(`- Products with descriptions: ${withDescriptions}/${enhancedProducts.length}`);
    
    return enhancedProducts;
    
  } catch (error) {
    console.error('Error during detailed crawl:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the detailed crawl
crawlProductDetails()
  .then(products => {
    console.log(`\nDetailed crawl completed successfully! Enhanced ${products.length} products.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Detailed crawl failed:', error);
    process.exit(1);
  });
