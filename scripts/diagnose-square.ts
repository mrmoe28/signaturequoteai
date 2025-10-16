/**
 * Diagnose Square API Configuration
 *
 * Checks Square credentials, permissions, and connectivity
 */

import 'dotenv/config';

async function diagnoseSquare() {
  console.log('🔍 Diagnosing Square API Configuration...\n');

  // 1. Check environment variables
  console.log('1️⃣ Environment Variables:');
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const environment = process.env.SQUARE_ENVIRONMENT;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const applicationId = process.env.SQUARE_APPLICATION_ID;

  if (!accessToken) {
    console.log('   ❌ SQUARE_ACCESS_TOKEN is missing');
    process.exit(1);
  }

  // Check token format
  const tokenPrefix = accessToken.substring(0, 4);
  console.log(`   ✅ Access Token: ${tokenPrefix}... (${accessToken.length} chars)`);

  if (tokenPrefix === 'EAA' || tokenPrefix.startsWith('EAA')) {
    console.log('   ℹ️  Token Type: Production (starts with EAA)');
  } else if (tokenPrefix === 'EAAA' || tokenPrefix.startsWith('EAAA')) {
    console.log('   ℹ️  Token Type: Sandbox (starts with EAAA)');
  } else {
    console.log(`   ⚠️  Unexpected token format: ${tokenPrefix}`);
  }

  console.log(`   ✅ Environment: ${environment || 'sandbox (default)'}`);
  console.log(`   ✅ Location ID: ${locationId ? locationId.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`   ✅ Application ID: ${applicationId ? applicationId.substring(0, 8) + '...' : 'MISSING'}\n`);

  // 2. Check if environment matches token
  console.log('2️⃣ Environment Validation:');
  if (environment === 'production' && tokenPrefix.startsWith('EAAA')) {
    console.log('   ⚠️  WARNING: Environment is "production" but token looks like sandbox (EAAA)');
    console.log('   💡 Try changing SQUARE_ENVIRONMENT to "sandbox"\n');
  } else if (environment === 'sandbox' && tokenPrefix.startsWith('EAA') && !tokenPrefix.startsWith('EAAA')) {
    console.log('   ⚠️  WARNING: Environment is "sandbox" but token looks like production (EAA)');
    console.log('   💡 Try changing SQUARE_ENVIRONMENT to "production"\n');
  } else {
    console.log('   ✅ Environment matches token type\n');
  }

  // 3. Test API connectivity
  console.log('3️⃣ Testing Square API Connectivity...');

  try {
    const { SquareClient, SquareEnvironment } = await import('square');

    const env = environment === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

    const client = new SquareClient({
      token: accessToken,
      environment: env,
    });

    // Test 1: List locations
    console.log('   🔄 Testing: Locations API...');
    try {
      const locationsResponse = await client.locations.list();
      const locations = locationsResponse.locations || [];
      console.log(`   ✅ Locations API: Success (${locations.length} locations found)`);

      if (locations.length > 0) {
        console.log('   📍 Available Locations:');
        locations.forEach((loc) => {
          console.log(`      - ${loc.name} (${loc.id})`);
          if (loc.id === locationId) {
            console.log('        ✅ This is your configured location');
          }
        });
      }
    } catch (error: any) {
      console.log('   ❌ Locations API failed:', error.message);
      if (error.statusCode === 401) {
        console.log('      💡 Token is invalid or expired');
      }
    }

    console.log();

    // Test 2: Check catalog permissions
    console.log('   🔄 Testing: Catalog API (read)...');
    try {
      const catalogResponse = await client.catalog.list({ types: 'SUBSCRIPTION_PLAN' });
      console.log('   ✅ Catalog Read: Success');
    } catch (error: any) {
      console.log('   ❌ Catalog Read failed:', error.message);
      if (error.statusCode === 403) {
        console.log('      💡 Token lacks ITEMS_READ permission');
      }
    }

    console.log();

    // Test 3: Check subscription permissions
    console.log('   🔄 Testing: Subscriptions API (read)...');
    try {
      const subsResponse = await client.subscriptions.search({});
      console.log('   ✅ Subscriptions Read: Success');
    } catch (error: any) {
      console.log('   ❌ Subscriptions Read failed:', error.message);
      if (error.statusCode === 403) {
        console.log('      💡 Token lacks SUBSCRIPTIONS_READ permission');
      }
    }

    console.log();

  } catch (error: any) {
    console.log('   ❌ Failed to initialize Square client:', error.message);
    process.exit(1);
  }

  // 4. Recommendations
  console.log('4️⃣ Recommendations:');
  console.log('   To fix 401 errors, make sure:');
  console.log('   • Token environment matches SQUARE_ENVIRONMENT setting');
  console.log('   • Token has required permissions in Square Dashboard');
  console.log('   • Token has not expired (regenerate if needed)');
  console.log('\n   Required permissions:');
  console.log('   • ITEMS_READ, ITEMS_WRITE');
  console.log('   • SUBSCRIPTIONS_READ, SUBSCRIPTIONS_WRITE');
  console.log('   • ORDERS_READ, ORDERS_WRITE');
  console.log('   • PAYMENTS_READ, PAYMENTS_WRITE');
  console.log('\n   📚 Generate new token at:');
  console.log('   https://developer.squareup.com/apps\n');
}

diagnoseSquare()
  .then(() => {
    console.log('✅ Diagnosis complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
