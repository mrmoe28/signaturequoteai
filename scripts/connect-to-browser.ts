#!/usr/bin/env npx tsx

/**
 * Connect to Existing Browser for Google Cloud Setup
 * This script will connect to your existing browser session
 */

import { chromium } from 'playwright';

async function connectToExistingBrowser() {
  console.log('🔗 Connecting to your existing browser...');
  
  try {
    // Try to connect to existing browser
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected to existing browser!');
    
    const contexts = browser.contexts();
    let page;
    
    if (contexts.length > 0) {
      const pages = contexts[0].pages();
      if (pages.length > 0) {
        page = pages[0];
        console.log('✅ Using existing page');
      } else {
        page = await contexts[0].newPage();
        console.log('✅ Created new page in existing context');
      }
    } else {
      const context = await browser.newContext();
      page = await context.newPage();
      console.log('✅ Created new context and page');
    }
    
    // Navigate to Google Cloud Console
    console.log('🌐 Navigating to Google Cloud Console...');
    await page.goto('https://console.cloud.google.com/');
    
    console.log('✅ Ready! You can now use your existing browser session.');
    console.log('📋 Next steps:');
    console.log('1. Make sure you are logged into Google Cloud Console');
    console.log('2. Run the manual setup steps or use the automation script');
    
    // Keep the connection alive
    console.log('\n⏳ Keeping connection alive... Press Ctrl+C to exit');
    
    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      console.log('\n👋 Disconnecting...');
      process.exit(0);
    });
    
  } catch (error) {
    console.log('❌ Could not connect to existing browser');
    console.log('💡 Make sure your browser is running with debugging enabled:');
    console.log('   Chrome: chrome --remote-debugging-port=9222');
    console.log('   Edge: msedge --remote-debugging-port=9222');
    console.log('   Or run: npx playwright open --browser=chromium');
  }
}

connectToExistingBrowser().catch(console.error);
