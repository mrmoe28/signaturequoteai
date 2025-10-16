import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import bcrypt from 'bcryptjs';

async function createTestAccount() {
  const testEmail = 'square-test-' + Date.now() + '@test.com';
  const testPassword = 'TestPassword123!';

  const passwordHash = await bcrypt.hash(testPassword, 10);

  const [newUser] = await db.insert(users).values({
    email: testEmail,
    name: 'Square Test User',
    passwordHash: passwordHash,
    role: 'user',
    isActive: 'true',
  }).returning();

  console.log('✅ Test account created successfully!');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('User ID:', newUser.id);

  return { email: testEmail, password: testPassword, userId: newUser.id };
}

createTestAccount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error creating test account:', error);
    process.exit(1);
  });
