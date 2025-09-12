#!/usr/bin/env node

/**
 * Manual Google Cloud Setup Guide
 * Step-by-step instructions for setting up Google Cloud with your existing browser
 */

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

async function main() {
  console.log('🚀 Manual Google Cloud Setup Guide');
  console.log('===================================\n');
  
  console.log('This guide will walk you through setting up Google Cloud Console');
  console.log('using your existing browser session.\n');
  
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
  
  console.log('📋 Your Configuration:');
  console.log(`   Project Name: ${config.projectName}`);
  console.log(`   User Email: ${config.userEmail}`);
  console.log(`   Local URL: ${config.localUrl}`);
  console.log(`   Production URL: ${config.productionUrl}\n`);
  
  await question('Press Enter to start the setup guide...');
  
  console.log('\n🌐 STEP 1: Open Google Cloud Console');
  console.log('=====================================');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Make sure you are logged in with: ekosolarize@gmail.com');
  console.log('3. If not logged in, log in now\n');
  
  await question('Press Enter when you are on Google Cloud Console...');
  
  console.log('\n📁 STEP 2: Create New Project');
  console.log('=============================');
  console.log('1. Click the project dropdown at the top (next to "Google Cloud")');
  console.log('2. Click "New Project"');
  console.log(`3. Project name: ${config.projectName}`);
  console.log('4. Click "Create"');
  console.log('5. Wait for project creation to complete\n');
  
  await question('Press Enter when project is created...');
  
  console.log('\n🔌 STEP 3: Enable Required APIs');
  console.log('===============================');
  console.log('1. Go to "APIs & Services" → "Library"');
  console.log('2. Search for "Gmail API"');
  console.log('3. Click on it and press "Enable"');
  console.log('4. Go back to Library');
  console.log('5. Search for "Google+ API"');
  console.log('6. Click on it and press "Enable"\n');
  
  await question('Press Enter when APIs are enabled...');
  
  console.log('\n🔐 STEP 4: Configure OAuth Consent Screen');
  console.log('==========================================');
  console.log('1. Go to "APIs & Services" → "OAuth consent screen"');
  console.log('2. Choose "External" (unless you have Google Workspace)');
  console.log('3. Click "Create"');
  console.log('4. Fill in the form:');
  console.log(`   • App name: ${config.appName}`);
  console.log(`   • User support email: ${config.userEmail}`);
  console.log(`   • Developer contact information: ${config.userEmail}`);
  console.log('5. Click "Save and Continue"');
  console.log('6. Add scopes:');
  console.log('   • Click "Add or Remove Scopes"');
  console.log('   • Search for "gmail.send" and select it');
  console.log('   • Search for "userinfo.email" and select it');
  console.log('   • Search for "userinfo.profile" and select it');
  console.log('   • Click "Update"');
  console.log('7. Click "Save and Continue"');
  console.log('8. Add test users:');
  console.log(`   • Click "Add Users"`);
  console.log(`   • Enter: ${config.userEmail}`);
  console.log('   • Click "Add"');
  console.log('9. Click "Save and Continue"\n');
  
  await question('Press Enter when OAuth consent screen is configured...');
  
  console.log('\n🔑 STEP 5: Create OAuth 2.0 Credentials');
  console.log('========================================');
  console.log('1. Go to "APIs & Services" → "Credentials"');
  console.log('2. Click "Create Credentials" → "OAuth 2.0 Client ID"');
  console.log('3. Choose "Web application"');
  console.log('4. Fill in the form:');
  console.log(`   • Name: ${config.oauthClientName}`);
  console.log('5. Authorized JavaScript origins:');
  console.log(`   • Add: ${config.localUrl}`);
  if (config.productionUrl) {
    console.log(`   • Add: ${config.productionUrl}`);
  }
  console.log('6. Authorized redirect URIs:');
  console.log(`   • Add: ${config.localUrl}/api/auth/callback/google`);
  if (config.productionUrl) {
    console.log(`   • Add: ${config.productionUrl}/api/auth/callback/google`);
  }
  console.log('7. Click "Create"');
  console.log('8. Copy the Client ID and Client Secret (save them!)\n');
  
  await question('Press Enter when OAuth credentials are created...');
  
  console.log('\n👤 STEP 6: Create Service Account');
  console.log('==================================');
  console.log('1. Go to "IAM & Admin" → "Service Accounts"');
  console.log('2. Click "Create Service Account"');
  console.log('3. Fill in the form:');
  console.log(`   • Service account name: ${config.serviceAccountName}`);
  console.log('   • Description: Service account for sending quote emails via Gmail API');
  console.log('4. Click "Create and Continue"');
  console.log('5. Skip role assignment (click "Continue")');
  console.log('6. Click "Done"');
  console.log('7. Click on your new service account');
  console.log('8. Go to "Keys" tab');
  console.log('9. Click "Add Key" → "Create New Key" → "JSON"');
  console.log('10. Download the JSON file (save it securely!)\n');
  
  await question('Press Enter when service account is created and JSON is downloaded...');
  
  console.log('\n📝 STEP 7: Update Environment Variables');
  console.log('========================================');
  console.log('1. Run: node scripts/extract-service-account-credentials.js');
  console.log('2. This will extract credentials from the downloaded JSON');
  console.log('3. It will update your .env.local file automatically\n');
  
  await question('Press Enter to run the credential extractor...');
  
  // Run the credential extractor
  const { spawn } = require('child_process');
  const extractor = spawn('node', ['scripts/extract-service-account-credentials.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  extractor.on('close', async (code) => {
    if (code === 0) {
      console.log('\n✅ Credentials extracted successfully!');
      
      console.log('\n🧪 STEP 8: Test the Setup');
      console.log('==========================');
      console.log('1. Run: node scripts/test-new-google-setup.js');
      console.log('2. This will test all your credentials');
      console.log('3. Fix any issues that come up\n');
      
      await question('Press Enter to run the test script...');
      
      // Run the test script
      const tester = spawn('node', ['scripts/test-new-google-setup.js'], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      tester.on('close', (testCode) => {
        if (testCode === 0) {
          console.log('\n🎉 Setup completed successfully!');
          console.log('\n📋 Next steps:');
          console.log('1. Test Google sign-in in your app');
          console.log('2. Test quote email sending with PDF attachments');
          console.log('3. Deploy to production with production URLs');
        } else {
          console.log('\n❌ Some tests failed. Please check the error messages above.');
          console.log('You may need to fix some configuration issues.');
        }
        rl.close();
      });
    } else {
      console.log('\n❌ Credential extraction failed. Please check the error messages above.');
      rl.close();
    }
  });
}

main().catch(console.error);
