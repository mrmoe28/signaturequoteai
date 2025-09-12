const fs = require('fs');
const path = require('path');

function extractCredentials() {
  const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
  const jsonPath = path.join(downloadsPath, 'signatureqoute-e2bc41be61f3.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Service account JSON file not found:', jsonPath);
    process.exit(1);
  }
  
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const credentials = JSON.parse(jsonContent);
    
    // Validate that this is actually a service account file
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ This doesn't appear to be a service account JSON file. Missing fields: ${missingFields.join(', ')}`);
      console.log('Available fields:', Object.keys(credentials));
      process.exit(1);
    }
    
    console.log('📋 Extracted credentials:');
    console.log(`   Client Email: ${credentials.client_email}`);
    console.log(`   Project ID: ${credentials.project_id}`);
    console.log(`   Private Key: ${credentials.private_key.length} characters`);
    
    // Update .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add service account credentials
    const updates = {
      'GOOGLE_SERVICE_ACCOUNT_EMAIL': credentials.client_email,
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY': credentials.private_key,
      'GOOGLE_SERVICE_ACCOUNT_PROJECT_ID': credentials.project_id
    };
    
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}="${value}"`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment variables updated in .env.local');
    
  } catch (error) {
    console.error('❌ Error processing JSON file:', error.message);
    process.exit(1);
  }
}

extractCredentials();
