#!/usr/bin/env tsx

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceAccountConfig {
  projectId: string;
  serviceAccountName: string;
  serviceAccountEmail: string;
  privateKey: string;
  clientId: string;
}

class GmailServiceAccountSetup {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async setup() {
    console.log('🚀 Setting up Gmail API Service Account...');
    console.log('');

    try {
      await this.launchBrowser();
      await this.navigateToGoogleCloud();
      await this.createServiceAccount();
      await this.downloadCredentials();
      await this.saveCredentials();
      
      console.log('');
      console.log('✅ Gmail API Service Account setup complete!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Add the environment variables to your .env.local file');
      console.log('2. Add the environment variables to your Vercel project');
      console.log('3. Test the Gmail API connection');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async launchBrowser() {
    console.log('🌐 Launching browser...');
    this.browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
  }

  private async navigateToGoogleCloud() {
    console.log('🔗 Navigating to Google Cloud Console...');
    await this.page!.goto('https://console.cloud.google.com/');
    await this.page!.waitForTimeout(3000);
    
    console.log('⚠️  Please sign in to your Google account and select your project');
    console.log('   Press Enter when ready to continue...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve(undefined));
    });
  }

  private async createServiceAccount() {
    console.log('👤 Creating service account...');
    
    // Navigate to Service Accounts
    await this.page!.goto('https://console.cloud.google.com/iam-admin/serviceaccounts');
    await this.page!.waitForTimeout(2000);
    
    // Click Create Service Account
    await this.page!.click('button:has-text("Create Service Account")');
    await this.page!.waitForTimeout(2000);
    
    // Fill service account details
    const serviceAccountName = 'signature-quote-gmail-sender';
    await this.page!.fill('input[name="serviceAccountName"]', serviceAccountName);
    await this.page!.fill('input[name="serviceAccountDescription"]', 'Service account for sending quote emails via Gmail API');
    
    // Create and continue
    await this.page!.click('button:has-text("Create and Continue")');
    await this.page!.waitForTimeout(2000);
    
    // Skip role assignment
    await this.page!.click('button:has-text("Continue")');
    await this.page!.waitForTimeout(2000);
    
    // Done
    await this.page!.click('button:has-text("Done")');
    await this.page!.waitForTimeout(2000);
    
    console.log('✅ Service account created');
  }

  private async downloadCredentials() {
    console.log('🔑 Creating and downloading service account key...');
    
    // Click on the service account
    await this.page!.click('text=signature-quote-gmail-sender');
    await this.page!.waitForTimeout(2000);
    
    // Go to Keys tab
    await this.page!.click('text=Keys');
    await this.page!.waitForTimeout(1000);
    
    // Add new key
    await this.page!.click('button:has-text("Add Key")');
    await this.page!.click('text=Create new key');
    await this.page!.waitForTimeout(1000);
    
    // Select JSON format
    await this.page!.click('input[value="JSON"]');
    await this.page!.click('button:has-text("Create")');
    
    console.log('⏳ Waiting for key download...');
    await this.page!.waitForTimeout(5000);
    
    console.log('✅ Service account key downloaded');
  }

  private async saveCredentials() {
    console.log('💾 Saving credentials...');
    
    // The JSON file should be in the Downloads folder
    const downloadsPath = path.join(process.env.HOME || '', 'Downloads');
    const files = fs.readdirSync(downloadsPath);
    const jsonFile = files.find(file => file.includes('signature-quote-gmail-sender') && file.endsWith('.json'));
    
    if (!jsonFile) {
      throw new Error('Service account JSON file not found in Downloads folder');
    }
    
    const jsonPath = path.join(downloadsPath, jsonFile);
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const credentials = JSON.parse(jsonContent);
    
    // Create environment variables
    const envContent = `
# Gmail API Service Account Credentials
# Generated: ${new Date().toISOString()}

GOOGLE_SERVICE_ACCOUNT_EMAIL="${credentials.client_email}"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="${credentials.private_key}"

# Optional: For domain-wide delegation (if you want emails from your business email)
# BUSINESS_EMAIL="your-business@yourdomain.com"
`;

    // Save to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);
    
    // Save to secret-keys folder
    const secretPath = path.join(process.cwd(), 'secret-keys', 'gmail-service-account.json');
    fs.writeFileSync(secretPath, jsonContent);
    
    console.log('✅ Credentials saved to:');
    console.log(`   - ${envPath}`);
    console.log(`   - ${secretPath}`);
    
    // Clean up downloaded file
    fs.unlinkSync(jsonPath);
    console.log('🧹 Cleaned up downloaded file');
  }

  private async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the setup
const setup = new GmailServiceAccountSetup();
setup.setup().catch(console.error);
