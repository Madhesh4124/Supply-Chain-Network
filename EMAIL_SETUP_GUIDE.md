# Email Configuration Setup Guide

This guide will help you configure email functionality for sending reports and alerts.

## Prerequisites

- A valid email account (Gmail, Outlook, or custom SMTP server)
- Access to email account settings

## Setup Steps

### 1. Create Environment File

Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

### 2. Configure Email Settings

Edit the `.env` file and update the following variables:

#### For Gmail:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
```

**Important for Gmail Users:**
1. Enable 2-Factor Authentication on your Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate a new App Password for "Mail"
4. Use this 16-character App Password (not your regular password) in `EMAIL_PASSWORD`

#### For Outlook/Hotmail:

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_password_here
```

#### For Custom SMTP Server:

```env
EMAIL_HOST=your.smtp.server.com
EMAIL_PORT=587
EMAIL_USER=your_username
EMAIL_PASSWORD=your_password
```

### 3. Set Frontend URL

Update the frontend URL for email links:

```env
FRONTEND_URL=http://localhost:3000
```

For production, use your actual domain:
```env
FRONTEND_URL=https://yourdomain.com
```

### 4. Verify Configuration

After setting up your `.env` file, restart the backend server and test the email configuration:

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Test email configuration via API:
   ```bash
   curl http://localhost:5000/api/email/verify
   ```

   You should see:
   ```json
   {
     "message": "Email configuration is valid",
     "status": "ready",
     "host": "smtp.gmail.com",
     "user": "your_email@gmail.com"
   }
   ```

## Testing Email Features

### 1. Send Test Report

From the dashboard:
1. Click the "Email" button
2. Enter your email address
3. Click "Send Report"

### 2. Send Risk Alert

From the dashboard:
1. Click the "Send Alert" button
2. Alert will be sent to your registered email (if logged in)

### 3. Enable Automatic Alerts

From the dashboard:
1. Scroll to "Automatic Risk Alerts" section
2. Toggle the switch to enable
3. Select monitoring frequency
4. Alerts will be sent automatically when risks are detected

## Troubleshooting

### Error: "Authentication failed"

**Gmail:**
- Make sure you're using an App Password, not your regular password
- Verify 2-Factor Authentication is enabled
- Check that "Less secure app access" is NOT enabled (use App Passwords instead)

**Outlook:**
- Verify your username and password are correct
- Check if your account requires additional security settings

### Error: "Connection timeout"

- Check your firewall settings
- Verify the SMTP host and port are correct
- Try using port 465 with `secure: true` in the transporter config

### Error: "Invalid email configuration"

- Make sure all required environment variables are set
- Check for typos in variable names
- Restart the backend server after changing `.env`

### Email not received

- Check spam/junk folder
- Verify the recipient email address is correct
- Check server logs for error messages
- Test with the `/api/email/verify` endpoint first

## Email Features

### 1. Manual Report Sending
- Send comprehensive PDF and Excel reports via email
- Includes network metrics, critical nodes, bottlenecks, and recommendations

### 2. Risk Alerts
- Manual alerts for immediate notification of network issues
- Includes disrupted nodes, high-risk routes, and bottlenecks

### 3. Scheduled Reports
- Daily, weekly, or monthly automated reports
- Configurable via API or user preferences

### 4. Automatic Alert Monitoring
- Continuous monitoring at configurable intervals (15min, 30min, hourly, 6hours, daily)
- Automatic email alerts when risks are detected
- No manual intervention required

## Security Best Practices

1. **Never commit `.env` file to version control**
   - Already added to `.gitignore`
   - Use `.env.example` for documentation

2. **Use App Passwords for Gmail**
   - More secure than regular passwords
   - Can be revoked without changing your main password

3. **Rotate credentials regularly**
   - Change App Passwords periodically
   - Update `.env` file with new credentials

4. **Use environment-specific configurations**
   - Different credentials for development and production
   - Use secure secret management in production (e.g., AWS Secrets Manager, Azure Key Vault)

## Production Deployment

For production environments:

1. Use environment variables from your hosting platform
2. Enable TLS/SSL for email connections
3. Use a dedicated email service (SendGrid, AWS SES, etc.) for better deliverability
4. Set up proper DNS records (SPF, DKIM, DMARC)
5. Monitor email sending rates and quotas

## Support

If you continue to experience issues:
1. Check the backend server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test with a simple SMTP testing tool
4. Consult your email provider's documentation for SMTP settings
