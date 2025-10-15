import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Define users table schema inline
const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
});

const databaseUrl = process.env.DATABASE_URL;
const testPassword = 'Opendoors28$';
const testEmail = 'ekosolarize@gmail.com';

if (!databaseUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

try {
  console.log('Testing password verification for:', testEmail);

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash
    })
    .from(users)
    .where(eq(users.email, testEmail.toLowerCase()));

  if (result.length === 0) {
    console.log('❌ User NOT found in database');
    process.exit(1);
  }

  const user = result[0];

  if (!user.passwordHash) {
    console.log('❌ User has no password hash');
    process.exit(1);
  }

  console.log('✓ User found with password hash');
  console.log('  Hash preview:', user.passwordHash.substring(0, 30) + '...');

  // Verify the password
  console.log('\nVerifying password...');
  const isValid = await bcrypt.compare(testPassword, user.passwordHash);

  if (isValid) {
    console.log('✅ Password verification SUCCESSFUL');
    console.log('   The credentials are correct!');
  } else {
    console.log('❌ Password verification FAILED');
    console.log('   The password does not match the stored hash');
  }

} catch (error) {
  console.error('❌ Error during verification:', error.message);
  console.error(error);
  process.exit(1);
}
