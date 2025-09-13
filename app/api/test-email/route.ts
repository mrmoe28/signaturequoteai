import { NextResponse } from 'next/server';
import { verifyGmailConnectivity } from '@/lib/gmail-service';

export async function GET() {
  try {
    // Check required Gmail API creds
    const hasEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
    const hasKey = !!process.env.GOOGLE_PRIVATE_KEY;
    
    if (!hasEmail || !hasKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Gmail API credentials',
        hasEmail,
        hasKey,
        emailPrefix: process.env.GOOGLE_CLIENT_EMAIL ? 
          process.env.GOOGLE_CLIENT_EMAIL.substring(0, 3) + '***' : 'Not set',
        privateKeySet: hasKey,
      });
    }

    // Verify Gmail API connectivity
    const result = await verifyGmailConnectivity();

    return NextResponse.json({
      success: true,
      message: 'Gmail API connectivity successful',
      email: result.email,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Gmail API connectivity failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      hasEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
      emailPrefix: process.env.GOOGLE_CLIENT_EMAIL ? 
        process.env.GOOGLE_CLIENT_EMAIL.substring(0, 3) + '***' : 'Not set',
      privateKeySet: !!process.env.GOOGLE_PRIVATE_KEY,
    });
  }
}
