#!/usr/bin/env node

/**
 * Extract Service Account Credentials
 * Helper script to extract credentials from downloaded service account JSON file
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

function findServiceAccountFiles() {
  const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
  const files = fs.readdirSync(downloadsPath);
  
  // First, get all JSON files for debugging
  const allJsonFiles = files.filter(file => file.endsWith('.json'));
  console.log('📁 All JSON files found in Downloads:');
  allJsonFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  
  // Filter for service account files (more inclusive)
  const serviceAccountFiles = allJsonFiles.filter(file => 
    file.includes('service') || 
    file.includes('key') || 
    file.includes('credentials') ||
    file.includes('signature') ||  // Add signature as it's in your filename
    file.includes('gmail') ||      // Common in Gmail service accounts
    file.includes('email') ||      // Common in email service accounts
    file.includes('oauth') ||      // Common in OAuth credentials
    file.includes('google')        // Common in Google service accounts
  );
  
  // If no files match the keywords, include all JSON files as potential candidates
  if (serviceAccountFiles.length === 0 && allJsonFiles.length > 0) {
    console.log('⚠️  No files matched service account keywords, showing all JSON files as candidates');
    return allJsonFiles;
  }
  
  return serviceAccountFiles;
}

function extractCredentials(jsonPath) {
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const credentials = JSON.parse(jsonContent);
    
    // Validate that this is actually a service account file
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ This doesn't appear to be a service account JSON file. Missing fields: ${missingFields.join(', ')}`);
      console.log('Available fields:', Object.keys(credentials));
      return null;
    }
    
    return {
      clientEmail: credentials.client_email,
      privateKey: credentials.private_key,
      projectId: credentials.project_id,
      clientId: credentials.client_id
    };
  } catch (error) {
    console.error('❌ Error reading JSON file:', error.message);
    return null;
  }
}

function updateEnvFile(credentials) {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update service account credentials
  const updates = [
    { key: 'GOOGLE_CLIENT_EMAIL', value: credentials.clientEmail },
    { key: 'GOOGLE_PRIVATE_KEY', value: credentials.privateKey }
  ];
  
  for (const update of updates) {
    const regex = new RegExp(`^${update.key}=.*$`, 'm');
    const newLine = `${update.key}="${update.value}"`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
      console.log(`✅ Updated ${update.key}`);
    } else {
      envContent += `\n${newLine}`;
      console.log(`✅ Added ${update.key}`);
    }
  }
  
  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment variables updated in .env.local');
}

async function main() {
  console.log('🔑 Service Account Credentials Extractor');
  console.log('==========================================\n');
  
  // Look for service account files in Downloads
  const serviceAccountFiles = findServiceAccountFiles();
  
  if (serviceAccountFiles.length === 0) {
    console.log('❌ No service account JSON files found in Downloads folder.');
    console.log('Please download the service account JSON file from Google Cloud Console first.');
    process.exit(1);
  }
  
  console.log('📁 Found service account files:');
  serviceAccountFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  
  // Let user choose file
  const choice = await question('\nEnter the number of the file to use (or press Enter for 1): ');
  const fileIndex = parseInt(choice) - 1 || 0;
  
  if (fileIndex < 0 || fileIndex >= serviceAccountFiles.length) {
    console.log('❌ Invalid selection');
    process.exit(1);
  }
  
  const selectedFile = serviceAccountFiles[fileIndex];
  const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
  const fullPath = path.join(downloadsPath, selectedFile);
  
  console.log(`\n📄 Processing: ${selectedFile}`);
  
  // Extract credentials
  const credentials = extractCredentials(fullPath);
  
  if (!credentials) {
    console.log('❌ Failed to extract credentials from JSON file');
    process.exit(1);
  }
  
  console.log('\n📋 Extracted credentials:');
  console.log(`   Client Email: ${credentials.clientEmail}`);
  console.log(`   Project ID: ${credentials.projectId}`);
  console.log(`   Private Key: ${credentials.privateKey.length} characters`);
  
  // Update .env.local
  const shouldUpdate = await question('\nUpdate .env.local with these credentials? (y/N): ');
  
  if (shouldUpdate.toLowerCase() === 'y' || shouldUpdate.toLowerCase() === 'yes') {
    updateEnvFile(credentials);
    
    console.log('\n🎉 Credentials extracted and updated successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/test-new-google-setup.js');
    console.log('2. Test your application');
  } else {
    console.log('\n📋 Manual setup:');
    console.log(`GOOGLE_CLIENT_EMAIL="${credentials.clientEmail}"`);
    console.log(`GOOGLE_PRIVATE_KEY="${credentials.privateKey}"`);
  }
  
  rl.close();
}

main().catch(console.error);
