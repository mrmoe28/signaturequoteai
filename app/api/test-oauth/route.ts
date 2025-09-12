import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check OAuth environment variables
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
    
    // Get partial values for debugging (without exposing full secrets)
    const clientIdPrefix = process.env.GOOGLE_CLIENT_ID ? 
      process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '***' : 'Not set';
    const clientSecretLength = process.env.GOOGLE_CLIENT_SECRET ? 
      process.env.GOOGLE_CLIENT_SECRET.length : 0;
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'Not set';
    
    // Check if variables are properly formatted
    const clientIdFormat = process.env.GOOGLE_CLIENT_ID ? 
      process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') : false;
    const clientSecretFormat = process.env.GOOGLE_CLIENT_SECRET ? 
      process.env.GOOGLE_CLIENT_SECRET.startsWith('GOCSPX-') : false;
    
    return NextResponse.json({
      success: true,
      oauth: {
        hasClientId,
        hasClientSecret,
        hasNextAuthUrl,
        hasNextAuthSecret,
        clientIdPrefix,
        clientSecretLength,
        nextAuthUrl,
        clientIdFormat,
        clientSecretFormat,
        // Raw values for debugging (be careful in production)
        rawClientId: process.env.GOOGLE_CLIENT_ID,
        rawClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
        rawNextAuthUrl: process.env.NEXTAUTH_URL,
        rawNextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check OAuth configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
