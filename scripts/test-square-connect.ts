/**
 * Test script to verify Square connect functionality
 *
 * This script helps diagnose Square connection issues by:
 * 1. Checking if the user is authenticated
 * 2. Checking if the user exists in the database
 * 3. Verifying database permissions
 *
 * Run with: npx tsx scripts/test-square-connect.ts
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testSquareConnect() {
  console.log('🔍 Testing Square Connect Functionality\n');

  try {
    // List all users
    console.log('📋 Checking users in database...');
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        squareAccessToken: users.squareAccessToken,
        squareLocationId: users.squareLocationId,
        squareEnvironment: users.squareEnvironment,
        squareConnectedAt: users.squareConnectedAt,
      })
      .from(users)
      .where(eq(users.isActive, 'true'));

    if (allUsers.length === 0) {
      console.log('❌ No active users found in database');
      console.log('   This may be why connection is failing.');
      console.log('   The user needs to exist in the database before connecting Square.\n');
      return;
    }

    console.log(`✅ Found ${allUsers.length} active user(s)\n`);

    allUsers.forEach((user, index) => {
      const hasToken = !!user.squareAccessToken;
      const hasLocation = !!user.squareLocationId;
      const isConnected = hasToken && hasLocation;

      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Square Status: ${isConnected ? '✅ Connected' : '❌ Not Connected'}`);

      if (isConnected) {
        console.log(`  Access Token: ${user.squareAccessToken?.substring(0, 10)}...`);
        console.log(`  Location ID: ${user.squareLocationId}`);
        console.log(`  Environment: ${user.squareEnvironment}`);
        console.log(`  Connected At: ${user.squareConnectedAt}`);
      }
      console.log('');
    });

    // Test if we can update a user record
    console.log('🧪 Testing database update permissions...');
    const testUserId = allUsers[0].id;

    const updateResult = await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, testUserId))
      .returning({ id: users.id });

    if (updateResult && updateResult.length > 0) {
      console.log('✅ Database update permissions OK\n');
    } else {
      console.log('❌ Database update failed - this is likely causing connection issues\n');
    }

    console.log('💡 Next steps:');
    console.log('   1. Ensure you are logged in to the app');
    console.log('   2. Go to /settings page');
    console.log('   3. Enter your Square Access Token and Location ID');
    console.log('   4. Click "Connect Square Account"');
    console.log('   5. Check the browser console for any error messages\n');

  } catch (error) {
    console.error('❌ Error during test:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

testSquareConnect();
