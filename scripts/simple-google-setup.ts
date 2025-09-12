#!/usr/bin/env npx tsx

/**
 * Simple Google Cloud Setup with Existing Browser
 * This script provides step-by-step instructions for manual setup
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface SetupConfig {
  projectName: string;
  userEmail: string;
  appName: string;
  localUrl: string;
  productionUrl?: string;
  serviceAccountName: string;
  oauthClientName: string;
}

class SimpleGoogleSetup {
  private config: SetupConfig;

  constructor(config: SetupConfig) {
    this.config = config;
  }

  async openGoogleCloudConsole() {
    console.log('🌐 Opening Google Cloud Console...');
    
    try {
      // Try to connect to existing browser
      const browser = await chromium.connectOverCDP('http://localhost:9222');
      const contexts = browser.contexts();
      let page;
      
      if (contexts.length > 0) {
        const pages = contexts[0].pages();
        page = pages[0] || await contexts[0].newPage();
      } else {
        const context = await browser.newContext();
        page = await context.newPage();
      }
      
      await page.goto('https://console.cloud.google.com/');
      console.log('✅ Google Cloud Console opened in your browser');
      
      return { browser, page };
    } catch (error) {
      console.log('⚠️  Could not connect to existing browser, launching new one...');
      const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
      });
      const page = await browser.newPage();
      await page.goto('https://console.cloud.google.com/');
      console.log('✅ New browser launched with Google Cloud Console');
      
      return { browser, page };
    }
  }

  printSetupInstructions() {
    console.log('\n📋 Google Cloud Setup Instructions');
    console.log('=====================================\n');
    
    console.log('Follow these steps in your browser:\n');
    
    console.log('1️⃣  CREATE PROJECT');
    console.log('   • Click the project dropdown at the top');
    console.log('   • Click "New Project"');
    console.log(`   • Project name: ${this.config.projectName}`);
    console.log('   • Click "Create"\n');
    
    console.log('2️⃣  ENABLE APIs');
    console.log('   • Go to "APIs & Services" → "Library"');
    console.log('   • Search for "Gmail API" and enable it');
    console.log('   • Search for "Google+ API" and enable it\n');
    
    console.log('3️⃣  OAUTH CONSENT SCREEN');
    console.log('   • Go to "APIs & Services" → "OAuth consent screen"');
    console.log('   • Choose "External"');
    console.log(`   • App name: ${this.config.appName}`);
    console.log(`   • User support email: ${this.config.userEmail}`);
    console.log(`   • Developer contact: ${this.config.userEmail}`);
    console.log('   • Add scopes: gmail.send, userinfo.email, userinfo.profile');
    console.log(`   • Add test user: ${this.config.userEmail}\n`);
    
    console.log('4️⃣  OAUTH CREDENTIALS');
    console.log('   • Go to "APIs & Services" → "Credentials"');
    console.log('   • Click "Create Credentials" → "OAuth 2.0 Client ID"');
    console.log('   • Choose "Web application"');
    console.log(`   • Name: ${this.config.oauthClientName}`);
    console.log(`   • Authorized origins: ${this.config.localUrl}`);
    if (this.config.productionUrl) {
      console.log(`   • Authorized origins: ${this.config.productionUrl}`);
    }
    console.log(`   • Redirect URIs: ${this.config.localUrl}/api/auth/callback/google`);
    if (this.config.productionUrl) {
      console.log(`   • Redirect URIs: ${this.config.productionUrl}/api/auth/callback/google`);
    }
    console.log('   • Click "Create"');
    console.log('   • Copy the Client ID and Client Secret\n');
    
    console.log('5️⃣  SERVICE ACCOUNT');
    console.log('   • Go to "IAM & Admin" → "Service Accounts"');
    console.log('   • Click "Create Service Account"');
    console.log(`   • Name: ${this.config.serviceAccountName}`);
    console.log('   • Description: Service account for sending quote emails via Gmail API');
    console.log('   • Click "Create and Continue"');
    console.log('   • Skip role assignment (click "Continue")');
    console.log('   • Click "Done"');
    console.log('   • Click on your service account');
    console.log('   • Go to "Keys" tab');
    console.log('   • Click "Add Key" → "Create New Key" → "JSON"');
    console.log('   • Download the JSON file\n');
    
    console.log('6️⃣  UPDATE ENVIRONMENT VARIABLES');
    console.log('   • Run: node scripts/extract-service-account-credentials.js');
    console.log('   • This will update your .env.local file\n');
    
    console.log('7️⃣  TEST SETUP');
    console.log('   • Run: node scripts/test-new-google-setup.js');
    console.log('   • Test your application\n');
  }

  async waitForUserInput(message: string): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise(resolve => {
      rl.question(message, () => {
        rl.close();
        resolve();
      });
    });
  }

  async run() {
    try {
      console.log('🚀 Simple Google Cloud Setup');
      console.log('============================\n');
      
      const { browser, page } = await this.openGoogleCloudConsole();
      
      this.printSetupInstructions();
      
      await this.waitForUserInput('\nPress Enter when you have completed all the steps...');
      
      console.log('\n✅ Setup completed!');
      console.log('📋 Next steps:');
      console.log('1. Run: node scripts/extract-service-account-credentials.js');
      console.log('2. Run: node scripts/test-new-google-setup.js');
      console.log('3. Test your application');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

// Load config
const configPath = path.join(__dirname, 'google-cloud-config.json');
let config: SetupConfig;

if (fs.existsSync(configPath)) {
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config = configData as SetupConfig;
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

const setup = new SimpleGoogleSetup(config);
setup.run().catch(console.error);
