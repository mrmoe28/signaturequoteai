import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// POST /api/auth/reset-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;

    // If token and newPassword provided, this is a reset request
    if (token && newPassword) {
      return await handlePasswordReset(token, newPassword);
    }

    // Otherwise, this is a reset request email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    return await handleResetRequest(email);
  } catch (error) {
    console.error('Password reset error:', error);

    // In development, return detailed error for debugging
    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: isDev
          ? `Password reset failed: ${errorMessage}`
          : 'An error occurred processing your request. Please try again later.'
      },
      { status: 500 }
    );
  }
}

async function handleResetRequest(email: string) {
  // Find user
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always return success even if user doesn't exist (security best practice)
  if (!userResult || userResult.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent',
    });
  }

  const user = userResult[0];

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour from now

  // Save token to database
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token: resetToken,
    expires,
    used: 'false',
  });

  // Check if email is configured
  const emailFrom = process.env.EMAIL_FROM || process.env.GOOGLE_CLIENT_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD || process.env.GOOGLE_APP_PASSWORD;
  const isEmailConfigured = emailFrom &&
    emailPassword &&
    !emailFrom.includes('your-') &&
    !emailPassword.includes('your-') &&
    emailPassword !== 'your-gmail-app-password';

  // Send email
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset?token=${resetToken}`;

    // If email is not configured, simulate in development mode
    if (!isEmailConfigured) {
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 PASSWORD RESET EMAIL (Simulated)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('To:', email);
        console.log('Subject: Reset Your Password');
        console.log('Reset URL:', resetUrl);
        console.log('Token expires in: 1 hour');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  Email not configured properly:');
        console.log('EMAIL_FROM:', emailFrom || 'NOT SET');
        console.log('EMAIL_PASSWORD:', emailPassword ? '[SET]' : 'NOT SET');
        console.log('\nTo enable real emails:');
        console.log('1. Update EMAIL_FROM in .env.local with your Gmail address');
        console.log('2. Update EMAIL_PASSWORD in .env.local with your Gmail App Password');
        console.log('3. See docs/GMAIL_SMTP_SETUP.md for instructions\n');

        // Return more helpful error in development
        return NextResponse.json({
          success: false,
          error: 'Email service not configured. Check server console for setup instructions.',
          devMode: true,
          resetUrl, // Only in development for testing
          emailConfig: {
            emailFrom: emailFrom || 'NOT SET',
            emailPasswordSet: !!emailPassword
          }
        });
      }

      // In production, fail gracefully
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Email is configured - send real email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailFrom,
        pass: emailPassword,
      },
    });

    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: 'Reset Your Password - Signature QuoteCrawler',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f766e;">Reset Your Password</h2>
          <p>You requested to reset your password for Signature QuoteCrawler.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link: ${resetUrl}</p>
        </div>
      `,
    });

    console.log(`✅ Password reset email sent to ${email}`);
  } catch (emailError) {
    console.error('Email sending error:', emailError);

    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';

    return NextResponse.json(
      {
        error: isDev
          ? `Failed to send reset email: ${errorMessage}. Check EMAIL_FROM and EMAIL_PASSWORD in .env.local`
          : 'Failed to send reset email. Please try again later.'
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'If an account exists with that email, a reset link has been sent',
  });
}

async function handlePasswordReset(token: string, newPassword: string) {
  // Validate password
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  // Find valid token
  const tokenResult = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, 'false')
      )
    )
    .limit(1);

  if (!tokenResult || tokenResult.length === 0) {
    return NextResponse.json(
      { error: 'Invalid or expired reset token' },
      { status: 400 }
    );
  }

  const resetToken = tokenResult[0];

  // Check if token is expired
  if (new Date() > resetToken.expires) {
    return NextResponse.json(
      { error: 'Reset token has expired. Please request a new one.' },
      { status: 400 }
    );
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, resetToken.userId));

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ used: 'true' })
    .where(eq(passwordResetTokens.id, resetToken.id));

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully',
  });
}
