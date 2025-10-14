const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

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

    // Send test email
    console.log('📤 Sending test email...');
    
    const info = await transporter.sendMail({
      from: emailFrom,
      to: emailFrom,
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
    console.log(`📬 Check ${emailFrom} for the test email`);
    console.log(`📋 Message ID: ${info.messageId}\n`);
    console.log('🎉 Email configuration is working perfectly!');
    
  } catch (error) {
    console.log('❌ Email test failed:');
    console.log(`Error: ${error.message}`);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Ensure 2-Factor Authentication is enabled');
      console.log('2. Use App Password, not regular Gmail password');
      console.log('3. Double-check the App Password format');
    }
  }
}

testEmailConfig().catch(console.error);