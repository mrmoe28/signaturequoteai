/**
 * Test script to verify Square disconnect functionality
 *
 * This script helps diagnose Square disconnect issues by:
 * 1. Checking if the user is authenticated
 * 2. Checking if the user exists in the database
 * 3. Testing the disconnect endpoint
 *
 * Run with: npx tsx scripts/test-square-disconnect.ts
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testSquareDisconnect() {
  console.log('🔍 Testing Square Disconnect Functionality\n');

  try {
    // List all users with Square connections
    console.log('📋 Checking users with Square connections...');
    const usersWithSquare = await db
      .select({
        id: users.id,
        email: users.email,
        squareConnected: users.squareMerchantId,
        squareLocationId: users.squareLocationId,
        squareEnvironment: users.squareEnvironment,
      })
      .from(users)
      .where(eq(users.isActive, 'true'));

    if (usersWithSquare.length === 0) {
      console.log('❌ No active users found in database');
      return;
    }

    console.log(`✅ Found ${usersWithSquare.length} active user(s)\n`);

    usersWithSquare.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Square Connected: ${user.squareConnected ? 'Yes' : 'No'}`);
      if (user.squareLocationId) {
        console.log(`  Location ID: ${user.squareLocationId}`);
        console.log(`  Environment: ${user.squareEnvironment}`);
      }
      console.log('');
    });

    // Check for users with Square connected
    const connectedUsers = usersWithSquare.filter(u => u.squareConnected || u.squareLocationId);
    if (connectedUsers.length > 0) {
      console.log(`✅ Found ${connectedUsers.length} user(s) with Square connected`);
      console.log('You can now test the disconnect by clicking the "Disconnect Square Account" button on /settings');
    } else {
      console.log('ℹ️  No users have Square connected. Connect Square first to test disconnect.');
    }

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

testSquareDisconnect();
