const nodemailer = require('nodemailer');
require('dotenv').config();

async function testResetEmail() {
  console.log('🧪 Testing Password Reset Email with GoDaddy/Titan...');

  // Use the exact settings from your .env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.titan.email',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const email = process.env.TEST_EMAIL || 'codesphere@unlimitedhealthcares.com';
  const token = 'test-reset-token-123';
  const frontendUrl = process.env.FRONTEND_URL || 'https://unlimitedhealthcares.com';
  const resetLink = `${frontendUrl}/auth?tab=reset&token=${token}`;

  const subject = 'Reset your password - Unlimited Health';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c5aa0;">Unlimited Health</h2>
      </div>
      <h3 style="color: #333;">Password Reset Request</h3>
      <p style="color: #666; line-height: 1.6;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #2c5aa0;">${resetLink}</a>
      </p>
    </div>
  `;

  try {
    console.log(`🔌 Connecting to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}...`);
    const info = await transporter.sendMail({
      from: `"Unlimited Health" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: subject,
      html: html,
    });
    console.log('✅ Success! Reset email sent.');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send reset email:', error.message);
    if (error.message.includes('535')) {
      console.log('\n💡 Tip: Check if "Third-party app access" is enabled in your Titan/GoDaddy settings.');
    }
  }
}

testResetEmail();
