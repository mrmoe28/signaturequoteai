import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { isNotNull } from 'drizzle-orm';

async function checkSquareConnection() {
  try {
    console.log('\n🔍 Checking Square OAuth Connections...\n');

    // Find users who have squareConnectedAt set (meaning they're connected)
    const usersWithSquare = await db
      .select()
      .from(users)
      .where(isNotNull(users.squareConnectedAt));

    if (usersWithSquare.length === 0) {
      console.log('❌ No users have Square connected!\n');
      process.exit(0);
    }

    usersWithSquare.forEach(user => {
      console.log('================================');
      console.log(`📧 Email: ${user.email}`);
      console.log(`🆔 User ID: ${user.id}`);
      console.log(`🏪 Merchant ID: ${user.squareMerchantId || 'Not set'}`);
      console.log(`📍 Location ID: ${user.squareLocationId || 'Not set'}`);
      console.log(`🌍 Environment: ${user.squareEnvironment || 'Not set'}`);
      console.log(`🔑 Access Token: ${user.squareAccessToken ? 'Present ✅' : 'Missing ❌'}`);
      console.log(`🔄 Refresh Token: ${user.squareRefreshToken ? 'Present ✅' : 'Missing ❌'}`);
      console.log(`📅 Connected At: ${user.squareConnectedAt}`);
      console.log('================================\n');
    });

    console.log(`✅ Found ${usersWithSquare.length} user(s) with Square connected\n`);

  } catch (error) {
    console.error('❌ Error checking Square connections:', error);
  }

  process.exit(0);
}

checkSquareConnection();
