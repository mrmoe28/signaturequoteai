/**
 * Production Login Test Script
 * Tests authentication flow on production environment
 */

const PRODUCTION_URL = 'https://signaturequoteai-main.vercel.app';
const TEST_CREDENTIALS = {
  email: 'ekosolarize@gmail.com',
  password: 'Opendoors28$'
};

const log = {
  timestamp: new Date().toISOString(),
  production_url: PRODUCTION_URL,
  test_email: TEST_CREDENTIALS.email,
  steps: [],
  errors: [],
  warnings: [],
  cookies: [],
  final_status: 'pending'
};

function addStep(description, data = {}) {
  const step = {
    timestamp: new Date().toISOString(),
    description,
    ...data
  };
  log.steps.push(step);
  console.log(`\n✓ ${description}`);
  if (Object.keys(data).length > 0) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
}

function addError(message, details = {}) {
  const error = {
    timestamp: new Date().toISOString(),
    message,
    ...details
  };
  log.errors.push(error);
  console.error(`\n✗ ERROR: ${message}`);
  if (Object.keys(details).length > 0) {
    console.error('  Details:', JSON.stringify(details, null, 2));
  }
}

function addWarning(message) {
  log.warnings.push({ timestamp: new Date().toISOString(), message });
  console.warn(`\n⚠ WARNING: ${message}`);
}

async function testProductionLogin() {
  console.log('\n=== PRODUCTION LOGIN TEST ===');
  console.log(`Target: ${PRODUCTION_URL}`);
  console.log(`Test User: ${TEST_CREDENTIALS.email}`);
  console.log(`Started: ${log.timestamp}\n`);

  try {
    // Step 1: Check if login page is accessible
    addStep('Testing login page accessibility');
    const loginPageResponse = await fetch(`${PRODUCTION_URL}/auth/sign-in`, {
      method: 'GET',
      headers: {
        'User-Agent': 'SignAgent/1.0 (Production Login Test)'
      }
    });

    if (!loginPageResponse.ok) {
      addError('Login page not accessible', {
        status: loginPageResponse.status,
        statusText: loginPageResponse.statusText
      });
      log.final_status = 'failed';
      return;
    }

    addStep('Login page is accessible', {
      status: loginPageResponse.status
    });

    // Step 2: Test login API endpoint
    addStep('Submitting login credentials to API');
    const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SignAgent/1.0 (Production Login Test)'
      },
      body: JSON.stringify(TEST_CREDENTIALS),
      credentials: 'include' // Important for cookie handling
    });

    const loginData = await loginResponse.json();

    // Capture cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      log.cookies.push(cookies);
      addStep('Session cookie received', { cookies });
    } else {
      addWarning('No session cookie in response');
    }

    // Step 3: Check login response
    if (!loginResponse.ok) {
      addError('Login failed', {
        status: loginResponse.status,
        statusText: loginResponse.statusText,
        response: loginData
      });
      log.final_status = 'failed';

      // Diagnose common issues
      if (loginResponse.status === 401) {
        addError('Authentication failed - Invalid credentials or password hash mismatch');
      } else if (loginResponse.status === 500) {
        addError('Server error during login - Check production logs');
      } else if (loginResponse.status === 400) {
        addError('Bad request - Missing or invalid fields');
      }

      return;
    }

    addStep('Login API successful', {
      status: loginResponse.status,
      response: loginData
    });

    // Step 4: Verify user data in response
    if (!loginData.user) {
      addWarning('No user data in response');
    } else {
      addStep('User data received', {
        userId: loginData.user.id,
        email: loginData.user.email,
        name: loginData.user.name,
        role: loginData.user.role
      });
    }

    // Step 5: Test protected route access (dashboard)
    addStep('Testing access to protected route (dashboard)');

    // Extract session token from cookies if available
    let sessionToken = null;
    if (cookies) {
      const match = cookies.match(/session_token=([^;]+)/);
      if (match) {
        sessionToken = match[1];
        addStep('Session token extracted', { token: sessionToken.substring(0, 20) + '...' });
      }
    }

    // Try to access dashboard
    const dashboardResponse = await fetch(`${PRODUCTION_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'User-Agent': 'SignAgent/1.0 (Production Login Test)',
        'Cookie': sessionToken ? `session_token=${sessionToken}` : ''
      },
      redirect: 'manual' // Don't follow redirects
    });

    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const redirectLocation = dashboardResponse.headers.get('location');
      if (redirectLocation && redirectLocation.includes('sign-in')) {
        addError('Dashboard redirected to login - Session not working', {
          redirectTo: redirectLocation
        });
        log.final_status = 'failed';
      } else {
        addStep('Dashboard redirect detected', {
          status: dashboardResponse.status,
          redirectTo: redirectLocation
        });
      }
    } else if (dashboardResponse.status === 200) {
      addStep('Dashboard accessible - Authentication working!', {
        status: dashboardResponse.status
      });
      log.final_status = 'success';
    } else {
      addWarning(`Unexpected dashboard response: ${dashboardResponse.status}`);
    }

    // Final assessment
    if (log.errors.length === 0) {
      log.final_status = 'success';
      console.log('\n\n✅ ===== SUCCESS =====');
      console.log('Login test PASSED');
      console.log('Authentication flow is working correctly on production');
    } else if (log.errors.length > 0 && loginData.success) {
      log.final_status = 'partial';
      console.log('\n\n⚠️ ===== PARTIAL SUCCESS =====');
      console.log('Login API works but some issues detected');
    }

  } catch (error) {
    addError('Unexpected error during test', {
      message: error.message,
      stack: error.stack
    });
    log.final_status = 'failed';
  }

  // Print summary
  console.log('\n\n=== TEST SUMMARY ===');
  console.log(`Status: ${log.final_status.toUpperCase()}`);
  console.log(`Steps completed: ${log.steps.length}`);
  console.log(`Errors: ${log.errors.length}`);
  console.log(`Warnings: ${log.warnings.length}`);

  if (log.errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    log.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.message}`);
    });
  }

  if (log.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    log.warnings.forEach((warn, i) => {
      console.log(`  ${i + 1}. ${warn.message}`);
    });
  }

  // Save log to file
  const fs = await import('fs');
  const path = await import('path');

  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logPath = path.join(logsDir, 'signagent_log.json');
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log(`\n📄 Full log saved to: ${logPath}`);

  return log;
}

// Run the test
testProductionLogin()
  .then(() => {
    process.exit(log.final_status === 'success' ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
