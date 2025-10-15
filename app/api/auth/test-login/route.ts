import { NextRequest, NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to test login functionality
 * This helps identify where the error occurs in production
 */
export async function POST(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    steps: []
  };

  try {
    // Step 1: Check request parsing
    diagnostics.steps.push('Parsing request body');
    let body;
    try {
      body = await request.json();
      diagnostics.steps.push('Request body parsed successfully');
      diagnostics.requestData = {
        hasEmail: !!body.email,
        hasPassword: !!body.password,
        emailLength: body.email?.length || 0
      };
    } catch (parseError: any) {
      diagnostics.steps.push('ERROR: Failed to parse request body');
      diagnostics.error = {
        step: 'request_parsing',
        message: parseError.message
      };
      return NextResponse.json(diagnostics, { status: 400 });
    }

    // Step 2: Check environment variables
    diagnostics.steps.push('Checking environment variables');
    diagnostics.env = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      nodeEnv: process.env.NODE_ENV
    };

    // Step 3: Test database connection
    diagnostics.steps.push('Testing database connection');
    try {
      const { db } = await import('@/lib/db');
      diagnostics.steps.push('Database module imported');

      // Try a simple query
      const { users } = await import('@/lib/db/schema');
      const { eq } = await import('drizzle-orm');

      diagnostics.steps.push('Querying user from database');
      const result = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, body.email.toLowerCase()))
        .limit(1);

      diagnostics.steps.push('Database query completed');
      diagnostics.dbQuery = {
        userFound: result.length > 0,
        userId: result[0]?.id?.substring(0, 8) + '...' || null
      };

    } catch (dbError: any) {
      diagnostics.steps.push('ERROR: Database operation failed');
      diagnostics.error = {
        step: 'database_query',
        message: dbError.message,
        stack: dbError.stack
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Step 4: Test bcrypt
    diagnostics.steps.push('Testing bcrypt module');
    try {
      const bcrypt = await import('bcryptjs');
      diagnostics.steps.push('bcrypt module loaded');

      // Test a simple hash operation
      const testHash = await bcrypt.hash('test', 10);
      diagnostics.steps.push('bcrypt hash operation successful');
      diagnostics.bcrypt = {
        available: true,
        testHashLength: testHash.length
      };
    } catch (bcryptError: any) {
      diagnostics.steps.push('ERROR: bcrypt operation failed');
      diagnostics.error = {
        step: 'bcrypt_test',
        message: bcryptError.message
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Step 5: Test logger
    diagnostics.steps.push('Testing logger module');
    try {
      const { createLogger } = await import('@/lib/logger');
      const logger = createLogger('test');
      logger.info('Test log message');
      diagnostics.steps.push('Logger working correctly');
    } catch (loggerError: any) {
      diagnostics.steps.push('WARNING: Logger failed (non-critical)');
      diagnostics.warning = {
        step: 'logger_test',
        message: loggerError.message
      };
      // Continue - logger errors shouldn't block login
    }

    // Step 6: Test auth module
    diagnostics.steps.push('Testing auth module');
    try {
      const { verifyCredentials } = await import('@/lib/auth');
      diagnostics.steps.push('Auth module imported successfully');

      // Actually try to verify credentials
      diagnostics.steps.push('Attempting credential verification');
      const user = await verifyCredentials(body.email, body.password);

      if (user) {
        diagnostics.steps.push('Credential verification SUCCESSFUL');
        diagnostics.authResult = {
          success: true,
          userId: user.id.substring(0, 8) + '...',
          email: user.email
        };
      } else {
        diagnostics.steps.push('Credential verification FAILED (invalid credentials)');
        diagnostics.authResult = {
          success: false,
          reason: 'invalid_credentials'
        };
      }
    } catch (authError: any) {
      diagnostics.steps.push('ERROR: Auth module failed');
      diagnostics.error = {
        step: 'auth_verification',
        message: authError.message,
        stack: authError.stack
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }

    diagnostics.steps.push('All diagnostics completed successfully');
    diagnostics.overallStatus = 'SUCCESS';

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    diagnostics.steps.push('UNEXPECTED ERROR');
    diagnostics.error = {
      step: 'unexpected',
      message: error.message,
      stack: error.stack,
      name: error.name
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Login diagnostics endpoint',
    usage: 'POST with { email, password } to test login functionality',
    purpose: 'Identify where errors occur in the login flow'
  });
}
