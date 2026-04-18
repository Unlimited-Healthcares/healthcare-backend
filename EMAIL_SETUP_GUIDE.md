# 📧 Email Invitation System Setup Guide

## ✅ Current Status
The email invitation system is **95% complete** and ready to use! You just need to configure your email service.

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure Email Service (Resend - Recommended for Render)

Add these environment variables to your `.env` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev  # Use this until you verify your domain
FRONTEND_URL=https://unlimitedhealthcares.com
```

### Step 2: Get your API Key
1. Sign up at [resend.com](https://resend.com)
2. Create an API Key
3. (Optional) Verify your domain to use your own email address instead of `onboarding@resend.dev`

### Step 3: Test Email System

```bash
# Run the test script
node test-email-invitation.js

# Or test with specific email
TEST_EMAIL=your-test-email@example.com node test-email-invitation.js
```

## 🔧 Alternative Email Services

### Option A: Gmail (Requires Paid Render Tier)
```bash
# SMTP will only work if you upgrade Render to a paid plan
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@unlimitedhealthcares.com
```

## 🧪 Testing the System

### 1. Test Email Sending
```bash
# Run the test script
node test-email-invitation.js
```

### 2. Test API Endpoints
```bash
# Create an invitation
curl -X POST http://localhost:3000/api/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "invitationType": "staff_invitation",
    "role": "doctor",
    "message": "Welcome to our team!",
    "centerId": "center-uuid-here"
  }'
```

### 3. Test Invitation Acceptance
```bash
# Accept invitation (after user clicks email link)
curl -X POST http://localhost:3000/api/invitations/test-token-123/accept \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Smith",
    "password": "securepassword123",
    "phone": "+1234567890"
  }'
```

## 📧 Email Templates

The system includes beautiful HTML email templates for:

### Staff Invitations
- **Subject**: "You're invited to join {centerName}"
- **Content**: Professional team invitation with registration link

### Doctor Invitations
- **Subject**: "Connect with {senderName} on Unlimited Health"
- **Content**: Professional networking invitation

### Patient Invitations
- **Subject**: "Your doctor invites you to join Unlimited Health"
- **Content**: Patient portal invitation

### Collaboration Invitations
- **Subject**: "Collaboration Invitation on Unlimited Health"
- **Content**: Professional collaboration invitation

## 🔐 Security Features

- **Token-based Security**: 32-byte random tokens
- **7-day Expiration**: Invitations auto-expire
- **One-time Use**: Tokens become invalid after use
- **Email Validation**: Checks if user already exists
- **Auto-connection**: Users automatically join centers when accepting

## 🎯 Complete Workflow

1. **Center sends invitation** → `POST /api/invitations`
2. **System creates invitation record** with unique token
3. **Email sent** with registration link containing token
4. **User clicks link** → `GET /invitation/accept?token=...`
5. **User registers** → `POST /api/invitations/{token}/accept`
6. **System auto-adds user** to center staff
7. **User receives welcome notification**

## 🚨 Troubleshooting

### Common Issues

#### 1. Authentication Failed
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution**: Use App Password, not regular password

#### 2. Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution**: Check SMTP host and port settings

#### 3. Email Not Received
**Check**:
- Spam folder
- Email address is correct
- SMTP credentials are valid
- Firewall settings

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run start:dev
```

## 📊 Monitoring

### Email Delivery Status
- Check application logs for email sending status
- Monitor SMTP service logs
- Set up email delivery notifications

### Performance Metrics
- Email sending success rate
- Invitation acceptance rate
- Token expiration rate

## 🔄 Maintenance

### Regular Tasks
- Monitor email delivery rates
- Clean up expired invitations
- Update email templates as needed
- Monitor SMTP service health

### Backup Strategy
- Backup invitation records
- Export email templates
- Document SMTP configuration

## 🎉 Success!

Once configured, your email invitation system will:
- ✅ Send beautiful HTML emails
- ✅ Handle token-based security
- ✅ Auto-connect users to centers
- ✅ Provide real-time notifications
- ✅ Support all user types

The system is production-ready and will help grow your healthcare platform organically!
