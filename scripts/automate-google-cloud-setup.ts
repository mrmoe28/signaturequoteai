#!/usr/bin/env npx tsx

/**
 * Automated Google Cloud Console Setup
 * Uses Playwright to automate most of the Google Cloud project setup process
 */

import { chromium, Browser, Page } from 'playwright';
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

interface Credentials {
  oauthClientId: string;
  oauthClientSecret: string;
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
}

class GoogleCloudAutomator {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: SetupConfig;

  constructor(config: SetupConfig) {
    this.config = config;
  }

  async initialize() {
    console.log('🚀 Starting Google Cloud Console automation...');
    
    // Try to connect to existing browser first
    try {
      console.log('🔗 Attempting to connect to existing browser...');
      this.browser = await chromium.connectOverCDP('http://localhost:9222');
      const contexts = this.browser.contexts();
      if (contexts.length > 0) {
        this.page = contexts[0].pages()[0] || await contexts[0].newPage();
        console.log('✅ Connected to existing browser session');
      } else {
        this.page = await this.browser.newPage();
        console.log('✅ Created new page in existing browser');
      }
    } catch (error) {
      console.log('⚠️  Could not connect to existing browser, launching new one...');
      this.browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000,
        args: ['--remote-debugging-port=9222'] // Enable debugging port
      });
      this.page = await this.browser.newPage();
      console.log('✅ Launched new browser with debugging enabled');
    }
    
    // Set viewport for better compatibility
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async login() {
    console.log('🔐 Navigating to Google Cloud Console...');
    await this.page!.goto('https://console.cloud.google.com/');
    
    // Wait for login page and prompt user
    console.log('⏳ Please log in to your Google account in the browser window...');
    console.log('   After logging in, press Enter to continue...');
    
    // Wait for user to press Enter
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve(undefined));
    });
  }

  async createProject() {
    console.log('📁 Creating new Google Cloud project...');
    
    // Click on project dropdown
    await this.page!.click('[data-testid="project-selector"]');
    await this.page!.waitForTimeout(1000);
    
    // Click "New Project"
    await this.page!.click('text=New Project');
    await this.page!.waitForTimeout(2000);
    
    // Fill project name
    await this.page!.fill('input[name="projectName"]', this.config.projectName);
    await this.page!.waitForTimeout(1000);
    
    // Click Create
    await this.page!.click('button:has-text("Create")');
    
    // Wait for project creation to complete
    console.log('⏳ Waiting for project creation to complete...');
    await this.page!.waitForSelector('text=Project created', { timeout: 60000 });
    
    console.log('✅ Project created successfully!');
  }

  async enableAPIs() {
    console.log('🔌 Enabling required APIs...');
    
    const apis = [
      { name: 'Gmail API', url: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com' },
      { name: 'Google+ API', url: 'https://console.cloud.google.com/apis/library/plus.googleapis.com' }
    ];

    for (const api of apis) {
      console.log(`   Enabling ${api.name}...`);
      await this.page!.goto(api.url);
      await this.page!.waitForTimeout(2000);
      
      // Click Enable button
      await this.page!.click('button:has-text("Enable")');
      await this.page!.waitForTimeout(3000);
      
      console.log(`   ✅ ${api.name} enabled`);
    }
  }

  async setupOAuthConsentScreen() {
    console.log('🔐 Setting up OAuth consent screen...');
    
    await this.page!.goto('https://console.cloud.google.com/apis/credentials/consent');
    await this.page!.waitForTimeout(2000);
    
    // Choose External user type
    await this.page!.click('input[value="external"]');
    await this.page!.click('button:has-text("Create")');
    await this.page!.waitForTimeout(2000);
    
    // Fill app information
    await this.page!.fill('input[name="appName"]', this.config.appName);
    await this.page!.fill('input[name="userSupportEmail"]', this.config.userEmail);
    await this.page!.fill('input[name="developerContactInformation"]', this.config.userEmail);
    
    // Click Save and Continue
    await this.page!.click('button:has-text("Save and Continue")');
    await this.page!.waitForTimeout(2000);
    
    // Add scopes
    console.log('   Adding OAuth scopes...');
    await this.page!.click('button:has-text("Add or Remove Scopes")');
    await this.page!.waitForTimeout(2000);
    
    // Add Gmail send scope
    await this.page!.fill('input[placeholder="Filter scopes"]', 'gmail.send');
    await this.page!.waitForTimeout(1000);
    await this.page!.click('input[value="https://www.googleapis.com/auth/gmail.send"]');
    
    // Add userinfo scopes
    await this.page!.fill('input[placeholder="Filter scopes"]', 'userinfo');
    await this.page!.waitForTimeout(1000);
    await this.page!.click('input[value="https://www.googleapis.com/auth/userinfo.email"]');
    await this.page!.click('input[value="https://www.googleapis.com/auth/userinfo.profile"]');
    
    // Update scopes
    await this.page!.click('button:has-text("Update")');
    await this.page!.waitForTimeout(2000);
    
    // Save and Continue
    await this.page!.click('button:has-text("Save and Continue")');
    await this.page!.waitForTimeout(2000);
    
    // Add test users
    console.log('   Adding test users...');
    await this.page!.click('button:has-text("Add Users")');
    await this.page!.fill('input[placeholder="Enter email addresses"]', this.config.userEmail);
    await this.page!.click('button:has-text("Add")');
    await this.page!.waitForTimeout(1000);
    
    // Save and Continue
    await this.page!.click('button:has-text("Save and Continue")');
    await this.page!.waitForTimeout(2000);
    
    console.log('✅ OAuth consent screen configured');
  }

  async createOAuthCredentials(): Promise<{ clientId: string; clientSecret: string }> {
    console.log('🔑 Creating OAuth 2.0 credentials...');
    
    await this.page!.goto('https://console.cloud.google.com/apis/credentials');
    await this.page!.waitForTimeout(2000);
    
    // Create OAuth client
    await this.page!.click('button:has-text("Create Credentials")');
    await this.page!.click('text=OAuth 2.0 Client ID');
    await this.page!.waitForTimeout(2000);
    
    // Choose Web application
    await this.page!.click('input[value="web"]');
    await this.page!.waitForTimeout(1000);
    
    // Fill client details
    await this.page!.fill('input[name="name"]', this.config.oauthClientName);
    
    // Add authorized origins
    await this.page!.click('button:has-text("Add URI")');
    await this.page!.fill('input[placeholder="Authorized JavaScript origins"]', this.config.localUrl);
    if (this.config.productionUrl) {
      await this.page!.click('button:has-text("Add URI")');
      await this.page!.fill('input[placeholder="Authorized JavaScript origins"]', this.config.productionUrl);
    }
    
    // Add redirect URIs
    await this.page!.click('button:has-text("Add URI")');
    await this.page!.fill('input[placeholder="Authorized redirect URIs"]', `${this.config.localUrl}/api/auth/callback/google`);
    if (this.config.productionUrl) {
      await this.page!.click('button:has-text("Add URI")');
      await this.page!.fill('input[placeholder="Authorized redirect URIs"]', `${this.config.productionUrl}/api/auth/callback/google`);
    }
    
    // Create
    await this.page!.click('button:has-text("Create")');
    await this.page!.waitForTimeout(3000);
    
    // Extract credentials
    const clientId = await this.page!.inputValue('input[value*="apps.googleusercontent.com"]');
    const clientSecret = await this.page!.inputValue('input[value*="GOCSPX-"]');
    
    console.log('✅ OAuth credentials created');
    return { clientId, clientSecret };
  }

  async createServiceAccount(): Promise<{ email: string; privateKey: string }> {
    console.log('👤 Creating service account...');
    
    await this.page!.goto('https://console.cloud.google.com/iam-admin/serviceaccounts');
    await this.page!.waitForTimeout(2000);
    
    // Create service account
    await this.page!.click('button:has-text("Create Service Account")');
    await this.page!.waitForTimeout(2000);
    
    // Fill service account details
    await this.page!.fill('input[name="serviceAccountName"]', this.config.serviceAccountName);
    await this.page!.fill('input[name="serviceAccountDescription"]', 'Service account for sending quote emails via Gmail API');
    
    // Create and continue
    await this.page!.click('button:has-text("Create and Continue")');
    await this.page!.waitForTimeout(2000);
    
    // Skip role assignment for now
    await this.page!.click('button:has-text("Continue")');
    await this.page!.waitForTimeout(2000);
    
    // Done
    await this.page!.click('button:has-text("Done")');
    await this.page!.waitForTimeout(2000);
    
    // Create and download key
    console.log('   Creating and downloading service account key...');
    await this.page!.click(`text=${this.config.serviceAccountName}`);
    await this.page!.waitForTimeout(2000);
    
    await this.page!.click('text=Keys');
    await this.page!.waitForTimeout(1000);
    
    await this.page!.click('button:has-text("Add Key")');
    await this.page!.click('text=Create new key');
    await this.page!.waitForTimeout(1000);
    
    await this.page!.click('input[value="JSON"]');
    await this.page!.click('button:has-text("Create")');
    
    // Wait for download to complete
    console.log('   ⏳ Waiting for key download...');
    await this.page!.waitForTimeout(5000);
    
    // Extract email from the page
    const email = await this.page!.textContent('text=@');
    
    console.log('✅ Service account created');
    return { email: email || '', privateKey: '' }; // Private key will be in downloaded JSON
  }

  async updateEnvironmentVariables(credentials: Credentials) {
    console.log('📝 Updating environment variables...');
    
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    // Read existing .env.local if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add variables
    const updates = [
      { key: 'NEXTAUTH_URL', value: this.config.localUrl },
      { key: 'NEXTAUTH_SECRET', value: this.generateNextAuthSecret() },
      { key: 'GOOGLE_CLIENT_ID', value: credentials.oauthClientId },
      { key: 'GOOGLE_CLIENT_SECRET', value: credentials.oauthClientSecret },
      { key: 'GOOGLE_CLIENT_EMAIL', value: credentials.serviceAccountEmail },
      { key: 'GOOGLE_PRIVATE_KEY', value: credentials.serviceAccountPrivateKey },
      { key: 'NEXT_PUBLIC_APP_URL', value: this.config.localUrl }
    ];
    
    for (const update of updates) {
      const regex = new RegExp(`^${update.key}=.*$`, 'm');
      const newLine = `${update.key}="${update.value}"`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    }
    
    // Write updated .env.local
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment variables updated in .env.local');
  }

  private generateNextAuthSecret(): string {
    return require('crypto').randomBytes(32).toString('base64');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.login();
      await this.createProject();
      await this.enableAPIs();
      await this.setupOAuthConsentScreen();
      
      const oauthCreds = await this.createOAuthCredentials();
      const serviceAccount = await this.createServiceAccount();
      
      // Note: Service account private key will be in the downloaded JSON file
      // You'll need to manually extract it and update the environment variables
      
      console.log('\n🎉 Google Cloud setup completed!');
      console.log('\n📋 Next steps:');
      console.log('1. Extract the private key from the downloaded service account JSON file');
      console.log('2. Update GOOGLE_PRIVATE_KEY in .env.local with the extracted key');
      console.log('3. Run: node scripts/test-new-google-setup.js');
      
    } catch (error) {
      console.error('❌ Error during automation:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  // Load config from file
  const configPath = path.join(__dirname, 'google-cloud-config.json');
  let config: SetupConfig;
  
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = configData as SetupConfig;
  } else {
    // Fallback to default config
    config = {
      projectName: 'SignatureQuoteCrawler',
      userEmail: 'your-email@gmail.com',
      appName: 'SignatureQuoteCrawler',
      localUrl: 'http://localhost:3000',
      productionUrl: 'https://your-domain.com',
      serviceAccountName: 'signature-quote-emailer',
      oauthClientName: 'SignatureQuoteCrawler Web Client'
    };
  }

  console.log('🤖 Google Cloud Console Automation');
  console.log('=====================================');
  console.log('This script will automate most of the Google Cloud setup process.');
  console.log('You will need to:');
  console.log('1. Log in to your Google account when prompted');
  console.log('2. Manually extract the service account private key from the downloaded JSON');
  console.log('3. Update the config object above with your email and production URL');
  console.log('\nPress Enter to continue...');
  
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve(undefined));
  });

  const automator = new GoogleCloudAutomator(config);
  await automator.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { GoogleCloudAutomator, SetupConfig, Credentials };
