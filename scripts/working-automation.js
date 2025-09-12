#!/usr/bin/env node

/**
 * Working Browser Automation for Google Cloud Setup
 * Fixed version that works with Desktop Commander
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function runAutomation() {
  console.log('🚀 Working Browser Automation for Google Cloud Setup');
  console.log('===================================================\n');
  
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
    
    await question('   Press Enter to continue...\n');
    
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
              rl.close();
            });
          } else {
            console.log('\n❌ Credential extraction failed.');
            rl.close();
          }
        });
      } else {
        console.log('\n❌ Playwright automation failed.');
        rl.close();
      }
    });
    
  } catch (error) {
    console.error('❌ Error during automation:', error);
    rl.close();
  }
}

runAutomation().catch(console.error);