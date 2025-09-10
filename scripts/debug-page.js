const puppeteer = require('puppeteer');

async function debugPage() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Visiting Signature Solar product page...');
    await page.goto('https://signaturesolar.com/solis-s6-7-6kw-single-phase-high-voltage-hybrid-inverter/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get all elements that might contain price information
    const pageInfo = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const priceElements = [];
      const textElements = [];
      
      allElements.forEach(el => {
        const text = el.textContent;
        if (text && (text.includes('$') || text.includes('Price') || text.includes('price'))) {
          priceElements.push({
            tagName: el.tagName,
            className: el.className,
            text: text.trim().substring(0, 100),
            id: el.id
          });
        }
        
        // Also collect elements with price-related classes
        if (el.className && typeof el.className === 'string' && el.className.includes('price')) {
          textElements.push({
            tagName: el.tagName,
            className: el.className,
            text: text.trim().substring(0, 100),
            id: el.id
          });
        }
      });
      
      return {
        priceElements: priceElements.slice(0, 20),
        textElements: textElements.slice(0, 20),
        pageTitle: document.title,
        url: window.location.href
      };
    });
    
    console.log('Page Info:');
    console.log('Title:', pageInfo.pageTitle);
    console.log('URL:', pageInfo.url);
    console.log('\nPrice-related elements:');
    pageInfo.priceElements.forEach(el => {
      console.log(`- ${el.tagName}.${el.className}: "${el.text}"`);
    });
    
    console.log('\nElements with "price" in class:');
    pageInfo.textElements.forEach(el => {
      console.log(`- ${el.tagName}.${el.className}: "${el.text}"`);
    });
    
    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugPage();
