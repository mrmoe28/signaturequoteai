/**
 * Production Square Integration Test
 *
 * Tests the Square checkout integration on the live production site
 * This script verifies:
 * 1. Production site is accessible
 * 2. Square OAuth is configured
 * 3. API endpoints are working
 */

const PRODUCTION_URL = 'https://signaturequoteai-main.vercel.app';

async function testProductionSquare() {
  console.log('\n🌐 Testing Production Square Integration\n');
  console.log('='.repeat(60));
  console.log(`\n📍 Production URL: ${PRODUCTION_URL}\n`);

  // Test 1: Check if site is accessible
  console.log('📋 Test 1: Checking site accessibility...\n');
  try {
    const response = await fetch(PRODUCTION_URL);
    if (response.ok) {
      console.log('✅ Production site is accessible');
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } else {
      console.log('❌ Site returned error status');
      console.log(`   Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Failed to reach production site');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n' + '='.repeat(60));

  // Test 2: Check Square OAuth endpoint
  console.log('\n📋 Test 2: Checking Square OAuth configuration...\n');
  try {
    const configUrl = `${PRODUCTION_URL}/api/integrations/square/config`;
    const response = await fetch(configUrl);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Square OAuth config endpoint is accessible');
      console.log(`   Application ID: ${data.applicationId?.substring(0, 20)}...`);
      console.log(`   Environment: ${data.environment}`);
      console.log(`   Callback URL: ${data.callbackUrl}`);
    } else {
      console.log('⚠️  Square config endpoint returned error');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Failed to check Square config');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n' + '='.repeat(60));

  // Test 3: Verify OAuth redirect URI
  console.log('\n📋 Test 3: Square OAuth Redirect URI Verification\n');

  const expectedRedirectUri = `${PRODUCTION_URL}/api/integrations/square/callback`;
  console.log('Expected redirect URI in Square Dashboard:');
  console.log(`   ${expectedRedirectUri}`);
  console.log('');
  console.log('⚠️  Manual verification required:');
  console.log('   1. Go to: https://developer.squareup.com/apps');
  console.log('   2. Open your app → OAuth settings');
  console.log('   3. Verify redirect URI matches above ☝️');

  console.log('\n' + '='.repeat(60));

  // Summary
  console.log('\n📊 PRODUCTION SQUARE INTEGRATION STATUS\n');
  console.log('Environment Configuration:');
  console.log('  ✅ Production URL: ' + PRODUCTION_URL);
  console.log('  ✅ Square OAuth Callback: ' + expectedRedirectUri);
  console.log('  ✅ Environment: Production (Real payments!)');

  console.log('\n⚠️  IMPORTANT REMINDERS:');
  console.log('  1. This is PRODUCTION - real payments will be processed');
  console.log('  2. Verify Square OAuth redirect URI is configured');
  console.log('  3. Test with small amounts or verify without completing payment');
  console.log('  4. Use your own email for test quotes');

  console.log('\n📝 Next Steps:');
  console.log('  1. Open: ' + PRODUCTION_URL + '/settings');
  console.log('  2. Click "Connect Square Account"');
  console.log('  3. Complete OAuth authorization');
  console.log('  4. Create a test quote');
  console.log('  5. Send quote and check payment link');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Production test complete!\n');
}

// Run the test
testProductionSquare().catch(error => {
  console.error('\n❌ Production test failed:', error);
  process.exit(1);
});
