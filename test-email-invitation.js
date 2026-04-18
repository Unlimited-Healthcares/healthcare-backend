#!/usr/bin/env node

/**
 * Test script for email invitation system
 * Run with: node test-email-invitation.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Test email configuration
const testConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

async function testEmailSending() {
  console.log('🧪 Testing Email Invitation System...\n');

  // Check if email credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Email credentials not configured!');
    console.log('Please set the following environment variables:');
    console.log('  SMTP_HOST=smtp.gmail.com');
    console.log('  SMTP_PORT=587');
    console.log('  SMTP_USER=your_email@gmail.com');
    console.log('  SMTP_PASS=your_app_password');
    console.log('  EMAIL_FROM=noreply@unlimtedhealth.com');
    console.log('\nFor Gmail, you need to:');
    console.log('1. Enable 2-factor authentication');
    console.log('2. Generate an App Password');
    console.log('3. Use the App Password (not your regular password)');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(testConfig);

    // Verify connection
    console.log('🔌 Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified successfully!\n');

    // Test email content
    const testEmail = {
      from: process.env.EMAIL_FROM || 'noreply@unlimtedhealth.com',
      to: process.env.TEST_EMAIL || 'test@example.com',
      subject: '🧪 Test Email - Healthcare Invitation System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">Join Unlimited Health Healthcare Team</h2>
          <p>You've been invited to join our healthcare team as a <strong>doctor</strong>.</p>
          <p><strong>Message:</strong> Welcome to our team! We're excited to have you join us.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.unlimtedhealth.com/invitation/accept?token=test-token-123" 
               style="background-color: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation & Register
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">This invitation expires in 7 days.</p>
        </div>
      `,
      text: 'Join Unlimited Health Healthcare Team\n\nYou\'ve been invited to join our healthcare team as a doctor.\n\nMessage: Welcome to our team! We\'re excited to have you join us.\n\nAccept Invitation: https://app.unlimtedhealth.com/invitation/accept?token=test-token-123\n\nThis invitation expires in 7 days.'
    };

    // Send test email
    console.log(`📧 Sending test email to: ${testEmail.to}`);
    const info = await transporter.sendMail(testEmail);

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Response: ${info.response}`);

    console.log('\n🎉 Email invitation system is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Check your email inbox');
    console.log('2. Test the invitation API endpoints');
    console.log('3. Verify the registration flow');

  } catch (error) {
    console.error('❌ Error testing email system:', error.message);

    if (error.code === 'EAUTH') {
      console.log('\n🔐 Authentication failed. Please check:');
      console.log('1. Your email credentials are correct');
      console.log('2. You\'re using an App Password (not regular password)');
      console.log('3. 2-factor authentication is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection failed. Please check:');
      console.log('1. Your internet connection');
      console.log('2. SMTP host and port settings');
      console.log('3. Firewall settings');
    }
  }
}

// Run the test
testEmailSending().catch(console.error);
