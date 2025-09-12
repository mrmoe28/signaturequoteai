import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are set (without exposing the actual values)
  const hasGoogleEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
  const hasGooglePassword = !!process.env.GOOGLE_APP_PASSWORD;
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  
  return NextResponse.json({
    success: true,
    environment: {
      // Gmail API
      hasGoogleEmail,
      hasGooglePassword,
      googleEmailPrefix: process.env.GOOGLE_CLIENT_EMAIL ? 
        process.env.GOOGLE_CLIENT_EMAIL.substring(0, 3) + '***' : 'Not set',
      appPasswordLength: process.env.GOOGLE_APP_PASSWORD ? 
        process.env.GOOGLE_APP_PASSWORD.length : 0,
      
      // OAuth
      hasGoogleClientId,
      hasGoogleClientSecret,
      googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID ? 
        process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '***' : 'Not set',
      googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET ? 
        process.env.GOOGLE_CLIENT_SECRET.length : 0,
        
      // NextAuth
      hasNextAuthUrl,
      hasNextAuthSecret,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
      
      // Database
      hasDatabaseUrl,
    }
  });
}
