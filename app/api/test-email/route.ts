import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Test Gmail SMTP connection
    const hasEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
    const hasPassword = !!process.env.GOOGLE_APP_PASSWORD;
    
    if (!hasEmail || !hasPassword) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials',
        hasEmail,
        hasPassword,
        emailPrefix: process.env.GOOGLE_CLIENT_EMAIL ? 
          process.env.GOOGLE_CLIENT_EMAIL.substring(0, 3) + '***' : 'Not set',
        passwordLength: process.env.GOOGLE_APP_PASSWORD ? 
          process.env.GOOGLE_APP_PASSWORD.length : 0,
      });
    }

    // Test SMTP connection
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_CLIENT_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    // Verify connection
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: 'SMTP connection successful',
      emailPrefix: process.env.GOOGLE_CLIENT_EMAIL.substring(0, 3) + '***',
      passwordLength: process.env.GOOGLE_APP_PASSWORD.length,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'SMTP connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      hasEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasPassword: !!process.env.GOOGLE_APP_PASSWORD,
      emailPrefix: process.env.GOOGLE_CLIENT_EMAIL ? 
        process.env.GOOGLE_CLIENT_EMAIL.substring(0, 3) + '***' : 'Not set',
      passwordLength: process.env.GOOGLE_APP_PASSWORD ? 
        process.env.GOOGLE_APP_PASSWORD.length : 0,
    });
  }
}
