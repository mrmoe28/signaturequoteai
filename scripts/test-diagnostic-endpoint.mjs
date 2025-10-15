/**
 * Test the diagnostic endpoint to identify production issues
 */

const PRODUCTION_URL = 'https://signaturequoteai-main.vercel.app';
const TEST_CREDENTIALS = {
  email: 'ekosolarize@gmail.com',
  password: 'Opendoors28$'
};

console.log('\n=== TESTING DIAGNOSTIC ENDPOINT ===');
console.log(`Target: ${PRODUCTION_URL}/api/auth/test-login\n`);

try {
  const response = await fetch(`${PRODUCTION_URL}/api/auth/test-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(TEST_CREDENTIALS)
  });

  console.log(`Response Status: ${response.status} ${response.statusText}\n`);

  const data = await response.json();

  console.log('=== DIAGNOSTIC RESULTS ===\n');
  console.log(JSON.stringify(data, null, 2));

  // Analyze results
  console.log('\n=== ANALYSIS ===\n');

  if (data.error) {
    console.log(`❌ Error at step: ${data.error.step}`);
    console.log(`   Message: ${data.error.message}`);
    if (data.error.stack) {
      console.log(`   Stack: ${data.error.stack.substring(0, 200)}...`);
    }
  }

  if (data.overallStatus === 'SUCCESS') {
    console.log('✅ All diagnostic checks PASSED');
    if (data.authResult?.success) {
      console.log('✅ Authentication is working correctly!');
    } else {
      console.log('⚠️  Authentication failed (credentials issue)');
    }
  } else {
    console.log('❌ Diagnostic checks FAILED');
    console.log('\nCompleted steps:');
    data.steps.forEach((step, i) => {
      const icon = step.includes('ERROR') ? '❌' : '✓';
      console.log(`  ${icon} ${i + 1}. ${step}`);
    });
  }

} catch (error) {
  console.error('❌ Failed to test diagnostic endpoint:', error.message);
  process.exit(1);
}
