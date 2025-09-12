#!/usr/bin/env node

/**
 * Google Cloud Setup Wizard
 * Interactive setup for Google Cloud Console automation
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
  console.log('🚀 Google Cloud Console Setup Wizard');
  console.log('=====================================\n');
  
  console.log('This wizard will help you configure the automated Google Cloud setup.');
  console.log('You can run this automation to create a new Google Cloud project\n');
  
  // Get user email
  const userEmail = await question('Enter your Google account email: ');
  
  // Get production URL (optional)
  const productionUrl = await question('Enter your production URL (or press Enter to skip): ');
  
  // Get project name
  const projectName = await question('Enter project name (default: SignatureQuoteCrawler): ') || 'SignatureQuoteCrawler';
  
  // Create config
  const config = {
    projectName: projectName,
    userEmail: userEmail,
    appName: 'SignatureQuoteCrawler',
    localUrl: 'http://localhost:3000',
    productionUrl: productionUrl || undefined,
    serviceAccountName: 'signature-quote-emailer',
    oauthClientName: 'SignatureQuoteCrawler Web Client'
  };
  
  // Save config
  const configPath = path.join(__dirname, 'google-cloud-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('\n✅ Configuration saved!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npx tsx scripts/automate-google-cloud-setup.ts');
  console.log('2. Log in to Google when the browser opens');
  console.log('3. Save the service account JSON file when it downloads');
  console.log('4. Run: node scripts/extract-service-account-credentials.js');
  console.log('5. Test: node scripts/test-new-google-setup.js');
  
  console.log('\n🎯 What the automation will do:');
  console.log('   • Create new Google Cloud project');
  console.log('   • Enable Gmail API and Google+ API');
  console.log('   • Configure OAuth consent screen');
  console.log('   • Create OAuth 2.0 client');
  console.log('   • Create service account for Gmail API');
  console.log('   • Update your .env.local file');
  
  const startNow = await question('\nStart the automation now? (y/N): ');
  
  if (startNow.toLowerCase() === 'y' || startNow.toLowerCase() === 'yes') {
    console.log('\n🚀 Starting automation...');
    console.log('The browser will open - please log in to your Google account when prompted.\n');
    
    // Run the automation
    const { spawn } = require('child_process');
    const automation = spawn('npx', ['tsx', 'scripts/automate-google-cloud-setup.ts'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    automation.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Automation completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: node scripts/extract-service-account-credentials.js');
        console.log('2. Test: node scripts/test-new-google-setup.js');
      } else {
        console.log('\n❌ Automation failed. Please check the error messages above.');
      }
      rl.close();
    });
  } else {
    console.log('\n📝 Configuration saved. Run the automation when ready:');
    console.log('   npx tsx scripts/automate-google-cloud-setup.ts');
    rl.close();
  }
}

main().catch(console.error);
