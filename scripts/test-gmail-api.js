const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testGmailAPI() {
  try {
    console.log('🔍 Testing Gmail API credentials...');
    
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('❌ Gmail API credentials not found in environment variables');
      return;
    }
    
    console.log('✅ Gmail API credentials found');
    console.log('Client Email:', process.env.GOOGLE_CLIENT_EMAIL);
    
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
    });
    
    console.log('🔐 Authenticating with Gmail API...');
    await auth.authorize();
    console.log('✅ Authentication successful');
    
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Test getting user profile
    console.log('👤 Testing Gmail API access...');
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Gmail API access successful');
    console.log('User Email:', profile.data.emailAddress);
    
    // Test sending a simple email
    console.log('📧 Testing email sending...');
    const testMessage = {
      to: 'ekosolarize@gmail.com',
      subject: 'Test Email from Signature QuoteCrawler',
      text: 'This is a test email to verify Gmail API functionality.',
    };
    
    const message = createSimpleMessage(testMessage);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: message,
      },
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.data.id);
    
  } catch (error) {
    console.error('❌ Gmail API test failed:', error.message);
    console.error('Full error:', error);
  }
}

function createSimpleMessage({ to, subject, text }) {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
  ].join('\n');
  
  return Buffer.from(message).toString('base64url');
}

testGmailAPI();
