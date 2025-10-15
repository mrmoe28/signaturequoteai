import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Define users table schema inline
const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'),
  passwordHash: text('password_hash'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('user').notNull(),
  isActive: text('is_active').default('true').notNull(),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

try {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      firstName: users.firstName,
      role: users.role,
      isActive: users.isActive,
      hasPassword: users.passwordHash
    })
    .from(users)
    .where(eq(users.email, 'ekosolarize@gmail.com'));

  if (result.length === 0) {
    console.log('User NOT found in database');
  } else {
    console.log('User found:');
    console.log({
      id: result[0].id,
      email: result[0].email,
      name: result[0].name,
      firstName: result[0].firstName,
      role: result[0].role,
      isActive: result[0].isActive,
      hasPassword: result[0].hasPassword ? 'YES (hash present)' : 'NO'
    });
  }
} catch (error) {
  console.error('Database error:', error.message);
  process.exit(1);
}
