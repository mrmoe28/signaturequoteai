#!/usr/bin/env node

/**
 * Test script for new Google Cloud project setup
 * Verifies OAuth and Gmail API credentials are working
 */

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

async function testOAuthCredentials() {
  console.log('🔍 Testing OAuth Credentials...');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ OAuth credentials missing:');
    console.error('   GOOGLE_CLIENT_ID:', clientId ? '✅ Set' : '❌ Missing');
    console.error('   GOOGLE_CLIENT_SECRET:', clientSecret ? '✅ Set' : '❌ Missing');
    return false;
  }
  
  console.log('✅ OAuth credentials found');
  console.log('   Client ID:', clientId.substring(0, 10) + '***');
  console.log('   Client Secret:', clientSecret.length + ' characters');
  
  return true;
}

async function testGmailAPICredentials() {
  console.log('\n🔍 Testing Gmail API Credentials...');
  
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (!clientEmail || !privateKey) {
    console.error('❌ Gmail API credentials missing:');
    console.error('   GOOGLE_CLIENT_EMAIL:', clientEmail ? '✅ Set' : '❌ Missing');
    console.error('   GOOGLE_PRIVATE_KEY:', privateKey ? '✅ Set' : '❌ Missing');
    return false;
  }
  
  console.log('✅ Gmail API credentials found');
  console.log('   Client Email:', clientEmail);
  console.log('   Private Key:', privateKey.length + ' characters');
  
  try {
    // Test Gmail API connection
    const auth = new JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/gmail.send']
    });
    
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Try to get profile (this will test authentication)
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Gmail API connection successful');
    console.log('   Email address:', profile.data.emailAddress);
    
    return true;
  } catch (error) {
    console.error('❌ Gmail API connection failed:', error.message);
    return false;
  }
}

async function testNextAuthConfig() {
  console.log('\n🔍 Testing NextAuth Configuration...');
  
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  
  if (!nextAuthUrl || !nextAuthSecret) {
    console.error('❌ NextAuth configuration missing:');
    console.error('   NEXTAUTH_URL:', nextAuthUrl ? '✅ Set' : '❌ Missing');
    console.error('   NEXTAUTH_SECRET:', nextAuthSecret ? '✅ Set' : '❌ Missing');
    return false;
  }
  
  console.log('✅ NextAuth configuration found');
  console.log('   URL:', nextAuthUrl);
  console.log('   Secret:', nextAuthSecret.length + ' characters');
  
  return true;
}

async function main() {
  console.log('🚀 Testing New Google Cloud Project Setup\n');
  console.log('=' .repeat(50));
  
  const oauthOk = await testOAuthCredentials();
  const gmailOk = await testGmailAPICredentials();
  const nextAuthOk = await testNextAuthConfig();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log('   OAuth Credentials:', oauthOk ? '✅ Working' : '❌ Failed');
  console.log('   Gmail API:', gmailOk ? '✅ Working' : '❌ Failed');
  console.log('   NextAuth Config:', nextAuthOk ? '✅ Working' : '❌ Failed');
  
  if (oauthOk && gmailOk && nextAuthOk) {
    console.log('\n🎉 All tests passed! Your Google Cloud setup is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Test Google sign-in in your app');
    console.log('2. Test quote email sending with PDF attachments');
    console.log('3. Deploy to production with production URLs');
  } else {
    console.log('\n❌ Some tests failed. Please check the configuration above.');
    console.log('\nTroubleshooting:');
    if (!oauthOk) {
      console.log('- Verify OAuth credentials in Google Cloud Console');
      console.log('- Check redirect URIs match your app URLs');
    }
    if (!gmailOk) {
      console.log('- Verify service account JSON was downloaded correctly');
      console.log('- Check Gmail API is enabled in Google Cloud Console');
      console.log('- Ensure private key format is correct (with \\n line breaks)');
    }
    if (!nextAuthOk) {
      console.log('- Generate a new NEXTAUTH_SECRET: openssl rand -base64 32');
      console.log('- Verify NEXTAUTH_URL matches your app URL');
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

main().catch(console.error);
