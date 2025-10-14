#!/usr/bin/env tsx
/**
 * Email Configuration Test Script
 * Tests if Gmail SMTP is properly configured
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailConfig() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  const emailFrom = process.env.EMAIL_FROM || process.env.GOOGLE_CLIENT_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD || process.env.GOOGLE_APP_PASSWORD;

  console.log('📧 Email Configuration:');
  console.log(`EMAIL_FROM: ${emailFrom || '❌ NOT SET'}`);
  console.log(`EMAIL_PASSWORD: ${emailPassword ? '✅ SET (hidden)' : '❌ NOT SET'}`);
  console.log('');

  if (!emailFrom || !emailPassword) {
    console.log('❌ Email configuration incomplete!');
    console.log('Please update .env.local with your Gmail credentials');
    return;
  }

  if (emailPassword === 'your-gmail-app-password') {
    console.log('❌ Please update EMAIL_PASSWORD with your actual Gmail App Password');
    return;
  }

  // Test SMTP connection
  try {
    console.log('🔗 Testing SMTP connection...');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailFrom,
        pass: emailPassword,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email to sender
    console.log('📤 Sending test email...');
    
    await transporter.sendMail({
      from: emailFrom,
      to: emailFrom, // Send to self for testing
      subject: '✅ SignatureQuoteAI Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f766e;">✅ Email Configuration Success!</h2>
          <p>Your Gmail SMTP is properly configured for SignatureQuoteAI.</p>
          <p><strong>From:</strong> ${emailFrom}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="color: #666; font-size: 14px;">
            This is a test email to verify your password reset functionality will work.
          </p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📬 Check ${emailFrom} for the test email\n`);
    console.log('🎉 Email configuration is working perfectly!');
    
  } catch (error) {
    console.log('❌ Email test failed:');
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
      
      if (error.message.includes('Invalid login')) {
        console.log('\n💡 Troubleshooting:');
        console.log('1. Ensure 2-Factor Authentication is enabled on your Google account');
        console.log('2. Use an App Password, not your regular Gmail password');
        console.log('3. Double-check the App Password (16 characters, no spaces)');
      }
    }
  }
}

// Run the test
testEmailConfig().catch(console.error);