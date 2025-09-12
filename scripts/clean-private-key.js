#!/usr/bin/env node

/**
 * Utility to clean Google Service Account Private Key
 * Removes PEM format markers and properly formats for environment variables
 */

function cleanPrivateKey(privateKey) {
  if (!privateKey) {
    console.error('No private key provided');
    process.exit(1);
  }

  // Remove PEM format markers
  let cleaned = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/"/g, '') // Remove any quotes
    .trim();

  // Replace actual newlines with \n escape sequences for environment variables
  cleaned = cleaned.replace(/\n/g, '\\n');

  console.log('Cleaned private key for environment variable:');
  console.log('=====================================');
  console.log(cleaned);
  console.log('=====================================');
  console.log('\nCopy this value and paste it into your Vercel environment variable:');
  console.log('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
}

// Get private key from command line argument
const privateKey = process.argv[2];

if (!privateKey) {
  console.log('Usage: node clean-private-key.js "your-private-key-here"');
  console.log('\nExample:');
  console.log('node clean-private-key.js "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----"');
  process.exit(1);
}

cleanPrivateKey(privateKey);
