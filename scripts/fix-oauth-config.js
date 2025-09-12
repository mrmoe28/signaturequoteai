#!/usr/bin/env node

/**
 * OAuth Configuration Fix Script
 * Helps identify and fix OAuth 400 errors
 */

const https = require('https');

const VERCEL_URL = 'https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app';

async function testEnvironmentVariables() {
  console.log('🔍 Testing environment variables...\n');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/test-env`);
    const data = await response.json();
    
    console.log('✅ Environment Variables Status:');
    console.log('================================');
    
    // Check required variables
    const requiredVars = [
      'hasGoogleClientId',
      'hasGoogleClientSecret', 
      'hasNextAuthUrl',
      'hasNextAuthSecret',
      'hasDatabaseUrl'
    ];
    
    requiredVars.forEach(varName => {
      const status = data.environment[varName] ? '✅' : '❌';
      console.log(`${status} ${varName}: ${data.environment[varName]}`);
    });
    
    console.log('\n📋 Current Configuration:');
    console.log('========================');
    console.log(`NEXTAUTH_URL: ${data.environment.nextAuthUrl}`);
    console.log(`Google Client ID: ${data.environment.googleClientIdPrefix}`);
    console.log(`Google Client Secret: ${data.environment.googleClientSecretLength} chars`);
    
    // Check for issues
    console.log('\n🚨 Issues Found:');
    console.log('================');
    
    if (data.environment.nextAuthUrl !== VERCEL_URL) {
      console.log(`❌ NEXTAUTH_URL mismatch!`);
      console.log(`   Current: ${data.environment.nextAuthUrl}`);
      console.log(`   Should be: ${VERCEL_URL}`);
      console.log(`   Fix: Update NEXTAUTH_URL in Vercel environment variables`);
    }
    
    if (!data.environment.hasGoogleClientId) {
      console.log('❌ GOOGLE_CLIENT_ID is missing');
    }
    
    if (!data.environment.hasGoogleClientSecret) {
      console.log('❌ GOOGLE_CLIENT_SECRET is missing');
    }
    
    if (!data.environment.hasNextAuthSecret) {
      console.log('❌ NEXTAUTH_SECRET is missing');
    }
    
    console.log('\n🔧 Google Cloud Console Configuration:');
    console.log('=====================================');
    console.log('1. Go to: https://console.cloud.google.com/');
    console.log('2. Select project: SignatureQuoteCrawler');
    console.log('3. Go to: APIs & Services → Credentials');
    console.log('4. Click on your OAuth 2.0 Client ID');
    console.log('5. Update Authorized JavaScript origins:');
    console.log(`   ${VERCEL_URL}`);
    console.log('6. Update Authorized redirect URIs:');
    console.log(`   ${VERCEL_URL}/api/auth/callback/google`);
    console.log('7. Click SAVE');
    
    console.log('\n🔧 Vercel Environment Variables:');
    console.log('================================');
    console.log('1. Go to: https://vercel.com/dashboard');
    console.log('2. Select project: signaturequoteai');
    console.log('3. Go to: Settings → Environment Variables');
    console.log('4. Update NEXTAUTH_URL to:');
    console.log(`   ${VERCEL_URL}`);
    console.log('5. Ensure these are set:');
    console.log('   - GOOGLE_CLIENT_ID');
    console.log('   - GOOGLE_CLIENT_SECRET');
    console.log('   - NEXTAUTH_SECRET');
    console.log('   - DATABASE_URL');
    
    console.log('\n🧪 Test OAuth Flow:');
    console.log('==================');
    console.log(`1. Visit: ${VERCEL_URL}/auth/login`);
    console.log('2. Click "Sign in with Google"');
    console.log('3. Should redirect to Google OAuth');
    console.log('4. After authorization, should redirect back to your app');
    
  } catch (error) {
    console.error('❌ Error testing environment:', error.message);
  }
}

// Run the test
testEnvironmentVariables();
