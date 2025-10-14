import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are set (without exposing the actual values)
  const hasGoogleEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
  const hasGooglePassword = !!process.env.GOOGLE_APP_PASSWORD;
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  
  return NextResponse.json({
    success: true,
    environment: {
      hasGoogleEmail,
      hasGooglePassword,
      hasDatabaseUrl,
      googleEmailPrefix: process.env.GOOGLE_CLIENT_EMAIL ? 
        process.env.GOOGLE_CLIENT_EMAIL.substring(0, 3) + '***' : 'Not set',
      appPasswordLength: process.env.GOOGLE_APP_PASSWORD ? 
        process.env.GOOGLE_APP_PASSWORD.length : 0,
    }
  });
}
