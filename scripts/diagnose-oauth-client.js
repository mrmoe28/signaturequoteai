#!/usr/bin/env node

/**
 * OAuth Client Diagnostic Script
 * Helps identify issues with OAuth 401 invalid_client errors
 */

const VERCEL_URL = 'https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app';

async function diagnoseOAuthClient() {
  console.log('🔍 Diagnosing OAuth Client Issues...\n');
  
  try {
    // Test environment variables
    const envResponse = await fetch(`${VERCEL_URL}/api/test-env`);
    const envData = await envResponse.json();
    
    console.log('✅ Environment Variables Status:');
    console.log('================================');
    console.log(`GOOGLE_CLIENT_ID: ${envData.environment.hasGoogleClientId ? '✅ Set' : '❌ Missing'}`);
    console.log(`GOOGLE_CLIENT_SECRET: ${envData.environment.hasGoogleClientSecret ? '✅ Set' : '❌ Missing'}`);
    console.log(`Client ID Prefix: ${envData.environment.googleClientIdPrefix}`);
    console.log(`Client Secret Length: ${envData.environment.googleClientSecretLength} chars`);
    console.log(`NEXTAUTH_URL: ${envData.environment.nextAuthUrl}`);
    
    // Test OAuth endpoint
    console.log('\n🧪 Testing OAuth Endpoint:');
    console.log('==========================');
    
    try {
      const oauthResponse = await fetch(`${VERCEL_URL}/api/auth/providers`);
      const oauthData = await oauthResponse.json();
      
      if (oauthData.google) {
        console.log('✅ Google OAuth provider is configured');
        console.log(`   Client ID: ${oauthData.google.clientId ? 'Set' : 'Missing'}`);
        console.log(`   Client Secret: ${oauthData.google.clientSecret ? 'Set' : 'Missing'}`);
      } else {
        console.log('❌ Google OAuth provider not found');
      }
    } catch (error) {
      console.log('❌ Error testing OAuth endpoint:', error.message);
    }
    
    console.log('\n🚨 Common Causes of "OAuth client was not found":');
    console.log('================================================');
    console.log('1. ❌ Wrong Google Cloud Project');
    console.log('   - Client ID exists in different project');
    console.log('   - Check: https://console.cloud.google.com/');
    console.log('   - Verify you\'re in the correct project');
    
    console.log('\n2. ❌ OAuth Client Deleted');
    console.log('   - Client ID was accidentally deleted');
    console.log('   - Check: APIs & Services → Credentials');
    console.log('   - Look for your OAuth 2.0 Client ID');
    
    console.log('\n3. ❌ Project Mismatch');
    console.log('   - Client ID from different project');
    console.log('   - Environment variables point to wrong project');
    
    console.log('\n4. ❌ Incorrect Client ID Format');
    console.log('   - Client ID should start with numbers');
    console.log('   - Format: 123456789-abcdefg.apps.googleusercontent.com');
    console.log(`   - Your prefix: ${envData.environment.googleClientIdPrefix}`);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('=========================');
    console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
    console.log('2. Check you\'re in the correct project: SignatureQuoteCrawler');
    console.log('3. Go to: APIs & Services → Credentials');
    console.log('4. Look for OAuth 2.0 Client ID');
    console.log('5. If missing, create a new one:');
    console.log('   - Click "Create Credentials" → "OAuth 2.0 Client ID"');
    console.log('   - Application type: Web application');
    console.log('   - Name: SignatureQuoteCrawler Web Client');
    console.log('   - Authorized JavaScript origins:');
    console.log(`     ${VERCEL_URL}`);
    console.log('   - Authorized redirect URIs:');
    console.log(`     ${VERCEL_URL}/api/auth/callback/google`);
    
    console.log('\n6. Copy the new Client ID and Secret');
    console.log('7. Update Vercel environment variables');
    console.log('8. Redeploy your application');
    
    console.log('\n🧪 Test After Fix:');
    console.log('==================');
    console.log(`1. Visit: ${VERCEL_URL}/auth/login`);
    console.log('2. Click "Sign in with Google"');
    console.log('3. Should redirect to Google OAuth (not error)');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  }
}

// Run the diagnosis
diagnoseOAuthClient();
