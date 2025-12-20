# Email Service Setup Guide

This guide will help you set up email functionality for the contact form on your LinkedIn Post Bot.

## Overview

The contact form on the `/support` page allows users to submit support tickets. When submitted, the form:
1. Tries to send via your backend API using SMTP
2. Falls back to opening the user's email client if SMTP is not configured

## Gmail Setup (Recommended for Development)

### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable it if not already enabled

### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification** → **App passwords** (at the bottom)
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter: "LinkedIn Post Bot"
5. Click **Generate**
6. Copy the 16-character password (you won't see it again!)

### Step 3: Configure Environment Variables
Add these to your `.env` file:

```bash
# Email Service (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=cliffdetech@gmail.com
SMTP_PASSWORD=your_16_character_app_password_here
FROM_EMAIL=cliffdetech@gmail.com
```

**Important**: Use the app password, NOT your regular Gmail password!

## Alternative Email Providers

### SendGrid (Recommended for Production)
1. Sign up at https://sendgrid.com/ (free tier: 100 emails/day)
2. Create an API key
3. Configure:
```bash
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key_here
FROM_EMAIL=cliffdetech@gmail.com
```

### AWS SES (Simple Email Service)
1. Sign up for AWS
2. Verify your email in SES console
3. Create SMTP credentials
4. Configure:
```bash
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your_ses_smtp_username
SMTP_PASSWORD=your_ses_smtp_password
FROM_EMAIL=cliffdetech@gmail.com
```

### Mailgun
1. Sign up at https://www.mailgun.com/ (free tier: 5,000 emails/month)
2. Verify your domain or use sandbox domain
3. Get SMTP credentials from dashboard
4. Configure:
```bash
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=your_mailgun_smtp_username
SMTP_PASSWORD=your_mailgun_smtp_password
FROM_EMAIL=cliffdetech@gmail.com
```

## Testing the Setup

### 1. Install Dependencies
```bash
# In the project root
.venv\Scripts\python -m pip install -r backend\requirements.txt
```

### 2. Start the Backend
```bash
.venv\Scripts\python -m uvicorn backend.app:app --reload --port 8000
```

### 3. Test the Contact Form
1. Start the frontend: `cd web && npm run dev`
2. Navigate to: http://localhost:3000/support
3. Fill out the contact form
4. Click "Submit Ticket"
5. Check your email (cliffdetech@gmail.com) for the message

## Fallback Behavior

If SMTP is not configured or fails:
- The frontend will automatically open the user's default email client
- The email will be pre-filled with all form data
- User can send manually from their email client

## Email Format

Contact form emails include:
- **Priority badge** (Low, Medium, High, Urgent) with color coding
- **Sender information** (name and email)
- **Subject line** with priority prefix
- **Message body** formatted nicely
- **Reply-To header** set to sender's email for easy responses

### Example Email Subject:
```
[Support - HIGH] Can't connect LinkedIn account
```

### Email Body Includes:
- Priority level with visual badge
- Sender's name and email (clickable)
- Original subject
- Full message with formatting
- Footer with instructions to reply

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use app passwords** - Not your main account password
3. **Rotate credentials regularly** - Especially for production
4. **Limit SMTP permissions** - Only grant what's needed
5. **Monitor usage** - Watch for suspicious activity

## Troubleshooting

### Error: "Authentication failed"
- Double-check your app password (no spaces)
- Ensure 2-Step Verification is enabled (for Gmail)
- Verify SMTP_USERNAME is correct (full email for Gmail)

### Error: "Connection refused"
- Check SMTP_SERVER and SMTP_PORT are correct
- Ensure your firewall allows outbound connections on port 587
- Try port 465 with SSL instead of 587 with TLS

### Emails not arriving
- Check spam folder
- Verify FROM_EMAIL is correct
- For Gmail, ensure sender email is verified
- Check provider daily limits (SendGrid free tier: 100/day)

### Gmail-specific: "Less secure app access"
- This is no longer needed if using App Passwords
- App Passwords bypass this restriction

## Rate Limits

Be aware of provider rate limits:
- **Gmail**: ~100-500 emails/day (varies by account age)
- **SendGrid Free**: 100 emails/day
- **Mailgun Free**: 5,000 emails/month
- **AWS SES**: Pay as you go, very cheap

## Production Considerations

For production deployment:
1. **Use a dedicated email service** (SendGrid, Mailgun, AWS SES)
2. **Set up SPF, DKIM, DMARC** records for your domain
3. **Monitor bounce rates** and unsubscribes
4. **Implement rate limiting** on the contact endpoint
5. **Add CAPTCHA** to prevent spam (e.g., Google reCAPTCHA)
6. **Log all email attempts** for debugging
7. **Set up alerts** for failed deliveries

## Need Help?

- Check the logs: The email service logs all attempts
- Test with `curl`:
  ```bash
  curl -X POST http://localhost:8000/api/contact \
    -H "Content-Type: application/json" \
    -d '{
      "to": "cliffdetech@gmail.com",
      "from_email": "test@example.com",
      "name": "Test User",
      "subject": "Test Email",
      "body": "This is a test message"
    }'
  ```
- Email: cliffdetech@gmail.com
- Twitter: @cliffdetech
- GitHub: github.com/cliff-de-tech
