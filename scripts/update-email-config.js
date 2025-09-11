const fs = require('fs');
const path = require('path');

// Update the .env.local file with the correct email
const envPath = path.join(__dirname, '..', '.env.local');

try {
  // Read the current .env.local file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace the email address
  envContent = envContent.replace(
    /GOOGLE_CLIENT_EMAIL="[^"]*"/,
    'GOOGLE_CLIENT_EMAIL="ekosolarize@gmail.com"'
  );
  
  // Make sure the App Password is set correctly
  if (!envContent.includes('GOOGLE_APP_PASSWORD=')) {
    envContent += '\nGOOGLE_APP_PASSWORD="oysmzmpeqeewoarp"';
  } else {
    envContent = envContent.replace(
      /GOOGLE_APP_PASSWORD="[^"]*"/,
      'GOOGLE_APP_PASSWORD="oysmzmpeqeewoarp"'
    );
  }
  
  // Write the updated content back
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Successfully updated .env.local file!');
  console.log('📧 Email set to: ekosolarize@gmail.com');
  console.log('🔑 App Password set to: oysmzmpeqeewoarp');
  console.log('\n🔄 Please restart your development server for changes to take effect.');
  
} catch (error) {
  console.error('❌ Error updating .env.local:', error.message);
  console.log('\n📝 Manual update required:');
  console.log('1. Open .env.local file');
  console.log('2. Change GOOGLE_CLIENT_EMAIL to: "ekosolarize@gmail.com"');
  console.log('3. Set GOOGLE_APP_PASSWORD to: "oysmzmpeqeewoarp"');
}
