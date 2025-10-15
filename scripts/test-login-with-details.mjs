/**
 * Detailed login test with error capture
 */

const PRODUCTION_URL = 'https://signaturequoteai-main.vercel.app';
const TEST_CREDENTIALS = {
  email: 'ekosolarize@gmail.com',
  password: 'Opendoors28$'
};

console.log('\n=== PRODUCTION LOGIN TEST (Detailed) ===');
console.log(`Target: ${PRODUCTION_URL}/api/auth/login`);
console.log(`Time: ${new Date().toISOString()}\n`);

try {
  const response = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'SignAgent/1.0'
    },
    body: JSON.stringify(TEST_CREDENTIALS)
  });

  console.log(`Response Status: ${response.status} ${response.statusText}`);
  console.log(`Response Headers:`);

  // Log response headers
  response.headers.forEach((value, key) => {
    if (key.toLowerCase().includes('cookie') ||
        key.toLowerCase().includes('content-type') ||
        key.toLowerCase().includes('x-')) {
      console.log(`  ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
    }
  });

  // Try to get response body
  const contentType = response.headers.get('content-type');
  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
    console.log('\nResponse Body (JSON):');
    console.log(JSON.stringify(data, null, 2));
  } else {
    const text = await response.text();
    console.log('\nResponse Body (Text):');
    console.log(text.substring(0, 500));
  }

  // Analysis
  console.log('\n=== ANALYSIS ===');

  if (response.status === 500) {
    console.log('\n❌ SERVER ERROR (500)');
    console.log('This indicates a runtime error on the production server.');
    console.log('\nPossible causes:');
    console.log('  1. Database connection issue');
    console.log('  2. Missing environment variables');
    console.log('  3. Module import failure (bcrypt, pino, etc.)');
    console.log('  4. Runtime error in auth logic');

    if (data?.error) {
      console.log(`\nError message: ${data.error}`);
    }

    console.log('\n🔍 Next steps:');
    console.log('  1. Check Vercel production logs');
    console.log('  2. Verify DATABASE_URL is set in production');
    console.log('  3. Check if all dependencies are in package.json dependencies (not devDependencies)');
    console.log('  4. Test diagnostic endpoint once deployed');
  } else if (response.status === 401) {
    console.log('\n❌ UNAUTHORIZED (401)');
    console.log('Credentials were rejected.');
  } else if (response.status === 200) {
    console.log('\n✅ SUCCESS (200)');
    console.log('Login endpoint is working correctly!');
  }

} catch (error) {
  console.error('\n❌ REQUEST FAILED');
  console.error(`Error: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
}
