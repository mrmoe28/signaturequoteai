#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 * 
 * Checks if all required environment variables are properly configured
 * Run this before deployment or when setting up the project
 */

import { createLogger } from '../lib/logger';

const logger = createLogger('validate-env');

interface ValidationResult {
  valid: boolean;
  service: string;
  errors: string[];
  warnings: string[];
}

function validateSquareConfig(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    service: 'Square Payment',
    errors: [],
    warnings: [],
  };

  const requiredVars = ['SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID'];
  const optionalVars = ['SQUARE_ENVIRONMENT', 'SQUARE_APPLICATION_ID', 'SQUARE_WEBHOOK_SIGNATURE_KEY'];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      result.valid = false;
      result.errors.push(`${varName} is not set`);
    } else if (value.startsWith('your_') || value === 'placeholder') {
      result.valid = false;
      result.errors.push(`${varName} contains placeholder value: "${value}"`);
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    const value = process.env[varName];
    
    if (!value) {
      result.warnings.push(`${varName} is not set (optional)`);
    }
  }

  // Check environment setting
  const environment = process.env.SQUARE_ENVIRONMENT;
  if (!environment) {
    result.warnings.push('SQUARE_ENVIRONMENT not set, defaulting to sandbox');
  } else if (environment !== 'sandbox' && environment !== 'production') {
    result.warnings.push(`SQUARE_ENVIRONMENT has unexpected value: "${environment}"`);
  }

  return result;
}

function validateDatabaseConfig(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    service: 'Database',
    errors: [],
    warnings: [],
  };

  const requiredVars = ['DATABASE_URL'];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      result.valid = false;
      result.errors.push(`${varName} is not set`);
    } else if (value.includes('placeholder') || value === 'your_database_url') {
      result.valid = false;
      result.errors.push(`${varName} contains placeholder value`);
    }
  }

  return result;
}

function validateEmailConfig(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    service: 'Email (Gmail SMTP)',
    errors: [],
    warnings: [],
  };

  const requiredVars = ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_APP_PASSWORD'];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      result.valid = false;
      result.errors.push(`${varName} is not set`);
    } else if (value.includes('@gmail.com') && value === 'your-gmail@gmail.com') {
      result.valid = false;
      result.errors.push(`${varName} contains placeholder value`);
    } else if (varName === 'GOOGLE_APP_PASSWORD' && value === 'your-app-specific-password') {
      result.valid = false;
      result.errors.push(`${varName} contains placeholder value`);
    }
  }

  return result;
}

function validateAppConfig(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    service: 'Application',
    errors: [],
    warnings: [],
  };

  const requiredVars = ['NEXT_PUBLIC_APP_URL'];
  const optionalVars = ['SUPPORT_EMAIL', 'NODE_ENV'];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      result.warnings.push(`${varName} is not set, will default to localhost`);
    }
  }

  for (const varName of optionalVars) {
    const value = process.env[varName];
    
    if (!value) {
      result.warnings.push(`${varName} is not set (optional)`);
    }
  }

  return result;
}

function printResult(result: ValidationResult) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 ${result.service}`);
  console.log(`${'='.repeat(60)}`);

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✅ All configurations are valid!');
  } else {
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      result.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
  }

  return result.valid;
}

async function main() {
  console.log('\n🔧 Environment Variable Validation\n');

  const results = [
    validateAppConfig(),
    validateDatabaseConfig(),
    validateEmailConfig(),
    validateSquareConfig(),
  ];

  const allValid = results.map(printResult).every(valid => valid);

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  if (allValid) {
    console.log('✅ All required environment variables are configured correctly!');
    console.log('\nYou can proceed with:');
    console.log('  • npm run dev (local development)');
    console.log('  • npm run build (production build)');
    console.log('  • vercel deploy (deployment)\n');
    process.exit(0);
  } else {
    console.log('❌ Some required environment variables are missing or misconfigured.');
    console.log('\n📖 Next Steps:');
    console.log('  1. Check your .env.local file');
    console.log('  2. Review the setup documentation:');
    console.log('     • docs/VERCEL_ENVIRONMENT_SETUP.md');
    console.log('     • docs/SQUARE_PAYMENT_SETUP.md');
    console.log('     • docs/EMAIL_SETUP.md');
    console.log('  3. Update the missing/placeholder values');
    console.log('  4. Run this script again: npm run env:validate\n');
    process.exit(1);
  }
}

main().catch(error => {
  logger.error({ error }, 'Environment validation failed');
  console.error('\n💥 Validation script encountered an error:', error);
  process.exit(1);
});

