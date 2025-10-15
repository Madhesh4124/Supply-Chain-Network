# Forgot Password Feature Setup

## Overview
The forgot password feature has been implemented with email-based password reset functionality.

## Features Implemented

### Backend
1. **User Model Updates** (`backend/models/User.js`)
   - Added `resetPasswordToken` field to store hashed reset tokens
   - Added `resetPasswordExpire` field to track token expiration (10 minutes)
   - Added `getResetPasswordToken()` method to generate secure reset tokens

2. **API Routes** (`backend/routes/auth.js`)
   - `POST /api/auth/forgot-password` - Sends password reset email
   - `POST /api/auth/reset-password/:token` - Resets password using token

### Frontend
1. **Components**
   - `ForgotPassword.jsx` - Form to request password reset email
   - `ResetPassword.jsx` - Form to set new password using reset token
   
2. **Routes** (`App.js`)
   - `/forgot-password` - Forgot password page
   - `/reset-password/:token` - Reset password page with token

3. **API Service** (`services/api.js`)
   - `authAPI.forgotPassword(data)` - Request password reset
   - `authAPI.resetPassword(token, data)` - Reset password

4. **Login Component**
   - Added "Forgot password?" link next to password field

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Frontend URL (for reset link)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

### Other Email Services
You can use other email services by changing `EMAIL_SERVICE`:
- `gmail` (default)
- `outlook`
- `yahoo`
- Or configure SMTP manually using `EMAIL_HOST` and `EMAIL_PORT`

## User Flow

1. **Request Reset**
   - User clicks "Forgot password?" on login page
   - Enters their email address
   - Receives email with reset link (valid for 10 minutes)

2. **Reset Password**
   - User clicks link in email
   - Redirected to reset password page with token
   - Enters new password (minimum 6 characters)
   - Confirms new password
   - Redirected to login page after success

## Security Features

- **Token Hashing**: Reset tokens are hashed before storing in database
- **Token Expiration**: Tokens expire after 10 minutes
- **One-Time Use**: Tokens are deleted after successful password reset
- **Password Validation**: Minimum 6 characters required
- **Secure Password Storage**: Passwords are hashed using bcrypt

## Testing

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Test the flow:
   - Go to login page
   - Click "Forgot password?"
   - Enter a registered email
   - Check email for reset link
   - Click link and set new password
   - Login with new password

## Troubleshooting

### Email Not Sending
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- Check if 2FA is enabled and using App Password (for Gmail)
- Check server logs for email errors
- Ensure firewall allows SMTP connections

### Token Invalid/Expired
- Tokens expire after 10 minutes
- Request a new reset link
- Check system time is synchronized

### Password Not Updating
- Ensure password meets minimum length (6 characters)
- Check passwords match in confirm field
- Verify token hasn't expired
