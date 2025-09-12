#!/usr/bin/env npx tsx

/**
 * Connect to Existing Browser for Google Cloud Automation
 * This script connects to your existing browser and automates Google Cloud setup
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

class ExistingBrowserAutomator {
  private config: SetupConfig;
  private browser: any = null;
  private page: any = null;

  constructor(config: SetupConfig) {
    this.config = config;
  }

  async connectToExistingBrowser() {
    console.log('🔗 Connecting to existing browser...');
    
    try {
      // Try to connect to existing browser with debugging enabled
      this.browser = await chromium.connectOverCDP('http://localhost:9222');
      console.log('✅ Connected to existing browser!');
      
      const contexts = this.browser.contexts();
      if (contexts.length > 0) {
        const pages = contexts[0].pages();
        if (pages.length > 0) {
          this.page = pages[0];
          console.log('✅ Using existing page');
        } else {
          this.page = await contexts[0].newPage();
          console.log('✅ Created new page in existing context');
        }
      } else {
        const context = await this.browser.newContext();
        this.page = await context.newPage();
        console.log('✅ Created new context and page');
      }
      
      return true;
    } catch (error) {
      console.log('❌ Could not connect to existing browser');
      console.log('💡 Make sure your browser is running with debugging enabled');
      return false;
    }
  }

  async navigateToGoogleCloud() {
    console.log('🌐 Navigating to Google Cloud Console...');
    await this.page.goto('https://console.cloud.google.com/');
    console.log('✅ Google Cloud Console loaded');
  }

  async waitForUserLogin() {
    console.log('⏳ Please log in to your Google account in the browser...');
    console.log('   After logging in, press Enter to continue...');
    
    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    });
    
    return new Promise(resolve => {
      process.stdin.once('data', () => resolve(undefined));
    });
  }

  async createProject() {
    console.log('📁 Creating new Google Cloud project...');
    
    try {
      // Click on project dropdown
      await this.page.click('[data-testid="project-selector"]');
      await this.page.waitForTimeout(1000);
      
      // Click "New Project"
      await this.page.click('text=New Project');
      await this.page.waitForTimeout(2000);
      
      // Fill project name
      await this.page.fill('input[name="projectName"]', this.config.projectName);
      await this.page.waitForTimeout(1000);
      
      // Click Create
      await this.page.click('button:has-text("Create")');
      
      // Wait for project creation to complete
      console.log('⏳ Waiting for project creation to complete...');
      await this.page.waitForSelector('text=Project created', { timeout: 60000 });
      
      console.log('✅ Project created successfully!');
      return true;
    } catch (error) {
      console.log('❌ Project creation failed:', error.message);
      return false;
    }
  }

  async enableAPIs() {
    console.log('🔌 Enabling required APIs...');
    
    const apis = [
      { name: 'Gmail API', url: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com' },
      { name: 'Google+ API', url: 'https://console.cloud.google.com/apis/library/plus.googleapis.com' }
    ];

    for (const api of apis) {
      try {
        console.log(`   Enabling ${api.name}...`);
        await this.page.goto(api.url);
        await this.page.waitForTimeout(2000);
        
        // Click Enable button
        await this.page.click('button:has-text("Enable")');
        await this.page.waitForTimeout(3000);
        
        console.log(`   ✅ ${api.name} enabled`);
      } catch (error) {
        console.log(`   ❌ Failed to enable ${api.name}:`, error.message);
      }
    }
  }

  async setupOAuthConsentScreen() {
    console.log('🔐 Setting up OAuth consent screen...');
    
    try {
      await this.page.goto('https://console.cloud.google.com/apis/credentials/consent');
      await this.page.waitForTimeout(2000);
      
      // Choose External user type
      await this.page.click('input[value="external"]');
      await this.page.click('button:has-text("Create")');
      await this.page.waitForTimeout(2000);
      
      // Fill app information
      await this.page.fill('input[name="appName"]', this.config.appName);
      await this.page.fill('input[name="userSupportEmail"]', this.config.userEmail);
      await this.page.fill('input[name="developerContactInformation"]', this.config.userEmail);
      
      // Click Save and Continue
      await this.page.click('button:has-text("Save and Continue")');
      await this.page.waitForTimeout(2000);
      
      // Add scopes
      console.log('   Adding OAuth scopes...');
      await this.page.click('button:has-text("Add or Remove Scopes")');
      await this.page.waitForTimeout(2000);
      
      // Add Gmail send scope
      await this.page.fill('input[placeholder="Filter scopes"]', 'gmail.send');
      await this.page.waitForTimeout(1000);
      await this.page.click('input[value="https://www.googleapis.com/auth/gmail.send"]');
      
      // Add userinfo scopes
      await this.page.fill('input[placeholder="Filter scopes"]', 'userinfo');
      await this.page.waitForTimeout(1000);
      await this.page.click('input[value="https://www.googleapis.com/auth/userinfo.email"]');
      await this.page.click('input[value="https://www.googleapis.com/auth/userinfo.profile"]');
      
      // Update scopes
      await this.page.click('button:has-text("Update")');
      await this.page.waitForTimeout(2000);
      
      // Save and Continue
      await this.page.click('button:has-text("Save and Continue")');
      await this.page.waitForTimeout(2000);
      
      // Add test users
      console.log('   Adding test users...');
      await this.page.click('button:has-text("Add Users")');
      await this.page.fill('input[placeholder="Enter email addresses"]', this.config.userEmail);
      await this.page.click('button:has-text("Add")');
      await this.page.waitForTimeout(1000);
      
      // Save and Continue
      await this.page.click('button:has-text("Save and Continue")');
      await this.page.waitForTimeout(2000);
      
      console.log('✅ OAuth consent screen configured');
      return true;
    } catch (error) {
      console.log('❌ OAuth consent screen setup failed:', error.message);
      return false;
    }
  }

  async createOAuthCredentials() {
    console.log('🔑 Creating OAuth 2.0 credentials...');
    
    try {
      await this.page.goto('https://console.cloud.google.com/apis/credentials');
      await this.page.waitForTimeout(2000);
      
      // Create OAuth client
      await this.page.click('button:has-text("Create Credentials")');
      await this.page.click('text=OAuth 2.0 Client ID');
      await this.page.waitForTimeout(2000);
      
      // Choose Web application
      await this.page.click('input[value="web"]');
      await this.page.waitForTimeout(1000);
      
      // Fill client details
      await this.page.fill('input[name="name"]', this.config.oauthClientName);
      
      // Add authorized origins
      await this.page.click('button:has-text("Add URI")');
      await this.page.fill('input[placeholder="Authorized JavaScript origins"]', this.config.localUrl);
      if (this.config.productionUrl) {
        await this.page.click('button:has-text("Add URI")');
        await this.page.fill('input[placeholder="Authorized JavaScript origins"]', this.config.productionUrl);
      }
      
      // Add redirect URIs
      await this.page.click('button:has-text("Add URI")');
      await this.page.fill('input[placeholder="Authorized redirect URIs"]', `${this.config.localUrl}/api/auth/callback/google`);
      if (this.config.productionUrl) {
        await this.page.click('button:has-text("Add URI")');
        await this.page.fill('input[placeholder="Authorized redirect URIs"]', `${this.config.productionUrl}/api/auth/callback/google`);
      }
      
      // Create
      await this.page.click('button:has-text("Create")');
      await this.page.waitForTimeout(3000);
      
      console.log('✅ OAuth credentials created');
      return true;
    } catch (error) {
      console.log('❌ OAuth credentials creation failed:', error.message);
      return false;
    }
  }

  async createServiceAccount() {
    console.log('👤 Creating service account...');
    
    try {
      await this.page.goto('https://console.cloud.google.com/iam-admin/serviceaccounts');
      await this.page.waitForTimeout(2000);
      
      // Create service account
      await this.page.click('button:has-text("Create Service Account")');
      await this.page.waitForTimeout(2000);
      
      // Fill service account details
      await this.page.fill('input[name="serviceAccountName"]', this.config.serviceAccountName);
      await this.page.fill('input[name="serviceAccountDescription"]', 'Service account for sending quote emails via Gmail API');
      
      // Create and continue
      await this.page.click('button:has-text("Create and Continue")');
      await this.page.waitForTimeout(2000);
      
      // Skip role assignment for now
      await this.page.click('button:has-text("Continue")');
      await this.page.waitForTimeout(2000);
      
      // Done
      await this.page.click('button:has-text("Done")');
      await this.page.waitForTimeout(2000);
      
      // Create and download key
      console.log('   Creating and downloading service account key...');
      await this.page.click(`text=${this.config.serviceAccountName}`);
      await this.page.waitForTimeout(2000);
      
      await this.page.click('text=Keys');
      await this.page.waitForTimeout(1000);
      
      await this.page.click('button:has-text("Add Key")');
      await this.page.click('text=Create new key');
      await this.page.waitForTimeout(1000);
      
      await this.page.click('input[value="JSON"]');
      await this.page.click('button:has-text("Create")');
      
      // Wait for download to complete
      console.log('   ⏳ Waiting for key download...');
      await this.page.waitForTimeout(5000);
      
      console.log('✅ Service account created and key downloaded');
      return true;
    } catch (error) {
      console.log('❌ Service account creation failed:', error.message);
      return false;
    }
  }

  async run() {
    try {
      console.log('🚀 Google Cloud Console Automation (Existing Browser)');
      console.log('====================================================\n');
      
      // Connect to existing browser
      const connected = await this.connectToExistingBrowser();
      if (!connected) {
        console.log('❌ Could not connect to existing browser. Please make sure your browser is open.');
        return;
      }
      
      // Navigate to Google Cloud Console
      await this.navigateToGoogleCloud();
      
      // Wait for user to log in
      await this.waitForUserLogin();
      
      // Run automation steps
      console.log('\n🤖 Starting automation...');
      
      const projectCreated = await this.createProject();
      if (!projectCreated) return;
      
      await this.enableAPIs();
      await this.setupOAuthConsentScreen();
      await this.createOAuthCredentials();
      await this.createServiceAccount();
      
      console.log('\n🎉 Google Cloud setup completed!');
      console.log('\n📋 Next steps:');
      console.log('1. Run: node scripts/extract-service-account-credentials.js');
      console.log('2. Run: node scripts/test-new-google-setup.js');
      console.log('3. Test your application');
      
    } catch (error) {
      console.error('❌ Error during automation:', error);
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

const automator = new ExistingBrowserAutomator(config);
automator.run().catch(console.error);