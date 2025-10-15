#!/usr/bin/env tsx
/**
 * Create Test User Script
 * Creates a test user with known credentials for authentication testing
 */

import { createUser } from '../lib/auth';

async function main() {
  const testEmail = 'signagent-test@test.com';
  const testPassword = 'TestPassword123!';

  console.log('Creating test user for SignAgent...');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);

  const result = await createUser({
    email: testEmail,
    password: testPassword,
    firstName: 'SignAgent',
    lastName: 'Test',
    name: 'SignAgent Test',
  });

  if ('error' in result) {
    console.error('Error:', result.error);
    process.exit(1);
  }

  console.log('Success! User created with ID:', result.user.id);
  console.log('Session token:', result.sessionToken);
  process.exit(0);
}

main();
