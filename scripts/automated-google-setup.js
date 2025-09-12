#!/usr/bin/env node

/**
 * Automated Google Cloud Setup using Desktop Commander
 * This script will automate the Google Cloud Console setup process
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runAutomation() {
  console.log('🚀 Starting Automated Google Cloud Setup');
  console.log('========================================\n');
  
  // Load config
  const configPath = path.join(__dirname, 'google-cloud-config.json');
  let config;
  
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else {
    config = {
      projectName: 'SignatureQuoteCrawler',
      userEmail: 'ekosolarize@gmail.com',
      appName: 'SignatureQuoteCrawler',
      localUrl: 'http://localhost:3000',
      productionUrl: 'https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app',
      serviceAccountName: 'signature-quote-emailer',
      oauthClientName: 'SignatureQuoteCrawler Web Client'
    };
  }
  
  console.log('📋 Configuration:');
  console.log(`   Project: ${config.projectName}`);
  console.log(`   Email: ${config.userEmail}`);
  console.log(`   Local URL: ${config.localUrl}`);
  console.log(`   Production URL: ${config.productionUrl}\n`);
  
  try {
    // Step 1: Open Google Cloud Console
    console.log('🌐 Opening Google Cloud Console...');
    const openBrowser = spawn('open', ['https://console.cloud.google.com/']);
    await new Promise(resolve => openBrowser.on('close', resolve));
    
    console.log('✅ Google Cloud Console opened');
    console.log('⏳ Please log in to your Google account if not already logged in');
    console.log('   Then press Enter to continue...\n');
    
    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', async () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      
      // Step 2: Run the Playwright automation
      console.log('🤖 Starting Playwright automation...');
      const automation = spawn('npx', ['tsx', 'scripts/automate-google-cloud-setup.ts'], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      automation.on('close', async (code) => {
        if (code === 0) {
          console.log('\n✅ Playwright automation completed!');
          
          // Step 3: Extract credentials
          console.log('🔑 Extracting service account credentials...');
          const extractor = spawn('node', ['scripts/extract-service-account-credentials.js'], {
            stdio: 'inherit',
        cwd: process.cwd()
      });
      
      extractor.on('close', async (extractCode) => {
        if (extractCode === 0) {
          console.log('\n✅ Credentials extracted successfully!');
          
          // Step 4: Test setup
          console.log('🧪 Testing the setup...');
          const tester = spawn('node', ['scripts/test-new-google-setup.js'], {
            stdio: 'inherit',
            cwd: process.cwd()
          });
          
          tester.on('close', (testCode) => {
            if (testCode === 0) {
              console.log('\n🎉 Google Cloud setup completed successfully!');
              console.log('\n📋 Next steps:');
              console.log('1. Test Google sign-in in your app');
              console.log('2. Test quote email sending with PDF attachments');
              console.log('3. Deploy to production with production URLs');
            } else {
              console.log('\n❌ Some tests failed. Please check the error messages above.');
            }
            process.exit(0);
          });
        } else {
          console.log('\n❌ Credential extraction failed.');
          process.exit(1);
        }
      });
        } else {
          console.log('\n❌ Playwright automation failed.');
          process.exit(1);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error during automation:', error);
    process.exit(1);
  }
}

runAutomation().catch(console.error);
