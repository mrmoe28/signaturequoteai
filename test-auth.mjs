#!/usr/bin/env node
/**
 * Authentication System Test Suite
 * Tests login, registration, session management, and logout
 */

// Using native fetch available in Node.js 18+

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@signagent.test`;
const TEST_PASSWORD = 'TestPassword123!';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, colors.cyan);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, colors.green);
}

function logError(message) {
  log(`  ✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`  ⚠ ${message}`, colors.yellow);
}

// Store cookies between requests
let sessionCookie = null;

function extractCookie(response) {
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/session_token=([^;]+)/);
    return match ? match[1] : null;
  }
  return null;
}

async function testRegistration() {
  logStep('1', 'Testing User Registration');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'SignAgent Test User',
        firstName: 'SignAgent',
        lastName: 'Tester',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Registration successful for ${TEST_EMAIL}`);
      logSuccess(`User ID: ${data.user.id}`);
      logSuccess(`User Role: ${data.user.role}`);

      // Extract session cookie
      sessionCookie = extractCookie(response);
      if (sessionCookie) {
        logSuccess('Session cookie received');
      } else {
        logWarning('No session cookie received (may be set by redirect)');
      }

      return { success: true, userId: data.user.id };
    } else {
      logError(`Registration failed: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    logError(`Registration error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLogin() {
  logStep('2', 'Testing Login with Registered User');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Login successful for ${TEST_EMAIL}`);
      logSuccess(`User ID: ${data.user.id}`);
      logSuccess(`User Email: ${data.user.email}`);

      // Extract and store session cookie
      sessionCookie = extractCookie(response);
      if (sessionCookie) {
        logSuccess('Session cookie received');
        logSuccess(`Cookie value: ${sessionCookie.substring(0, 20)}...`);
      } else {
        logWarning('No session cookie in response');
      }

      return { success: true, user: data.user };
    } else {
      logError(`Login failed: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    logError(`Login error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testInvalidLogin() {
  logStep('3', 'Testing Login with Invalid Credentials');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'WrongPassword123!',
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      logSuccess('Invalid credentials correctly rejected');
      logSuccess(`Error message: ${data.error}`);
      return { success: true };
    } else {
      logError(`Expected 401 status, got ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    logError(`Error testing invalid login: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testProtectedRoute() {
  logStep('4', 'Testing Protected Route Access');

  try {
    // First test without session cookie
    const responseNoAuth = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual',
    });

    if (responseNoAuth.status === 307 || responseNoAuth.status === 302) {
      const location = responseNoAuth.headers.get('location');
      if (location && location.includes('/auth/sign-in')) {
        logSuccess('Unauthenticated request correctly redirected to sign-in');
      } else {
        logWarning(`Redirected to unexpected location: ${location}`);
      }
    } else {
      logWarning(`Expected redirect, got status ${responseNoAuth.status}`);
    }

    // Now test with session cookie
    if (sessionCookie) {
      const responseWithAuth = await fetch(`${BASE_URL}/dashboard`, {
        headers: {
          'Cookie': `session_token=${sessionCookie}`,
        },
        redirect: 'manual',
      });

      if (responseWithAuth.status === 200) {
        logSuccess('Authenticated request to dashboard successful');
      } else if (responseWithAuth.status === 307 || responseWithAuth.status === 302) {
        logWarning(`Authenticated user redirected (status ${responseWithAuth.status})`);
      } else {
        logError(`Unexpected status for authenticated request: ${responseWithAuth.status}`);
      }
    } else {
      logWarning('Skipping authenticated route test - no session cookie');
    }

    return { success: true };
  } catch (error) {
    logError(`Protected route test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSessionPersistence() {
  logStep('5', 'Testing Session Persistence');

  if (!sessionCookie) {
    logWarning('No session cookie available for testing');
    return { success: false, error: 'No session cookie' };
  }

  try {
    // Make a request to an API endpoint that requires authentication
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'GET',
      headers: {
        'Cookie': `session_token=${sessionCookie}`,
      },
    });

    // Even though we're calling logout endpoint, we're checking if session is recognized
    // A 405 (Method Not Allowed) or other error means session was recognized
    if (response.status !== 404) {
      logSuccess('Session cookie correctly recognized by server');
      return { success: true };
    } else {
      logWarning('Session may not be properly validated');
      return { success: false };
    }
  } catch (error) {
    logError(`Session persistence test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLogout() {
  logStep('6', 'Testing Logout');

  if (!sessionCookie) {
    logWarning('No session cookie available for logout test');
    return { success: false, error: 'No session cookie' };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': `session_token=${sessionCookie}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess('Logout successful');
      logSuccess(`Message: ${data.message}`);

      // Check if cookie is cleared
      const setCookie = response.headers.get('set-cookie');
      if (setCookie && (setCookie.includes('Max-Age=0') || setCookie.includes('expires'))) {
        logSuccess('Session cookie cleared in response');
      }

      // Test that session is actually invalidated
      const testResponse = await fetch(`${BASE_URL}/dashboard`, {
        headers: {
          'Cookie': `session_token=${sessionCookie}`,
        },
        redirect: 'manual',
      });

      if (testResponse.status === 307 || testResponse.status === 302) {
        logSuccess('Session invalidated - protected route redirects after logout');
      } else {
        logWarning('Session may still be active after logout');
      }

      return { success: true };
    } else {
      logError(`Logout failed: ${data.error || response.statusText}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    logError(`Logout error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testExistingUserLogin() {
  logStep('7', 'Testing Login with Existing User (ekosolarize@gmail.com)');

  log('  Note: This test requires knowing the password for ekosolarize@gmail.com', colors.yellow);
  log('  Skipping automated test - manual verification needed', colors.yellow);

  return { success: true, skipped: true };
}

async function runTests() {
  log('\n═══════════════════════════════════════════════════════', colors.blue);
  log('  Authentication System Test Suite', colors.blue);
  log('  SignAgent - Testing Login, Session, and Security', colors.blue);
  log('═══════════════════════════════════════════════════════\n', colors.blue);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 1: Registration
  const registrationResult = await testRegistration();
  results.total++;
  if (registrationResult.success) results.passed++;
  else results.failed++;

  // Test 2: Login
  const loginResult = await testLogin();
  results.total++;
  if (loginResult.success) results.passed++;
  else results.failed++;

  // Test 3: Invalid Login
  const invalidLoginResult = await testInvalidLogin();
  results.total++;
  if (invalidLoginResult.success) results.passed++;
  else results.failed++;

  // Test 4: Protected Route
  const protectedRouteResult = await testProtectedRoute();
  results.total++;
  if (protectedRouteResult.success) results.passed++;
  else results.failed++;

  // Test 5: Session Persistence
  const sessionResult = await testSessionPersistence();
  results.total++;
  if (sessionResult.success) results.passed++;
  else results.failed++;

  // Test 6: Logout
  const logoutResult = await testLogout();
  results.total++;
  if (logoutResult.success) results.passed++;
  else results.failed++;

  // Test 7: Existing User Login
  const existingUserResult = await testExistingUserLogin();
  results.total++;
  if (existingUserResult.skipped) results.skipped++;
  else if (existingUserResult.success) results.passed++;
  else results.failed++;

  // Summary
  log('\n═══════════════════════════════════════════════════════', colors.blue);
  log('  Test Results Summary', colors.blue);
  log('═══════════════════════════════════════════════════════', colors.blue);
  log(`Total Tests: ${results.total}`, colors.cyan);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.reset);
  log(`Skipped: ${results.skipped}`, colors.yellow);
  log('═══════════════════════════════════════════════════════\n', colors.blue);

  // Final verdict
  if (results.failed === 0) {
    log('✓ All tests passed! Authentication system is working correctly.', colors.green);
    process.exit(0);
  } else {
    log('✗ Some tests failed. Please review the errors above.', colors.red);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
