const { google } = require('googleapis');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function getRefreshToken() {
  console.log('🔑 OAuth2 Refresh Token Generator');
  console.log('==================================\n');
  
  // Check if we have the required credentials
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('❌ Missing OAuth credentials. Please set:');
    console.log('   GOOGLE_CLIENT_ID');
    console.log('   GOOGLE_CLIENT_SECRET');
    console.log('\nThese should be in your .env.local file');
    process.exit(1);
  }
  
  console.log('✅ Found OAuth credentials');
  console.log(`   Client ID: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
  console.log(`   Client Secret: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...\n`);
  
  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/callback/google' // Use the web application redirect URI
  );
  
  // Generate the authorization URL
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  
  console.log('📋 Follow these steps:');
  console.log('1. Open this URL in your browser:');
  console.log(`   ${authUrl}\n`);
  console.log('2. Sign in with your Google account');
  console.log('3. Grant the requested permissions');
  console.log('4. Copy the authorization code from the page\n');
  
  const authCode = await question('Enter the authorization code: ');
  
  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);
    
    console.log('\n✅ Success! Here are your tokens:');
    console.log(`   Access Token: ${tokens.access_token.substring(0, 20)}...`);
    console.log(`   Refresh Token: ${tokens.refresh_token}\n`);
    
    console.log('📝 Add this to your .env.local file:');
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
    
    // Test the connection
    console.log('🧪 Testing Gmail API connection...');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log(`✅ Gmail API test successful!`);
    console.log(`   Email: ${profile.data.emailAddress}`);
    console.log(`   Messages Total: ${profile.data.messagesTotal}`);
    
  } catch (error) {
    console.error('❌ Error getting refresh token:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 This usually means:');
      console.log('   - The authorization code expired (try again)');
      console.log('   - The code was already used');
      console.log('   - There\'s a mismatch in OAuth settings');
    }
  }
  
  rl.close();
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

getRefreshToken().catch(console.error);
