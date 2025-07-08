# Manual Testing Guide

This document provides instructions for manually testing features that require human interaction or external service validation. Most functionality is covered by automated tests, but these scenarios require manual verification.

## Email Delivery Testing (Happy Path)

1. **Ensure all environment variables are set** in your `.env.local` file
2. **Start the development server:** `npm run dev`
3. **Navigate to `/contact`**
4. **Fill out and submit the form** with valid information
5. **Check your configured email address** for the message
6. **Expected Result:** Success message with "Message Sent!" and option to send another
7. **Verify:** Email content, formatting, and reply-to header work correctly

## Configuration Error Testing

These tests verify proper error handling when external services are misconfigured:

### Missing reCAPTCHA Configuration

Test that the form gracefully handles missing reCAPTCHA keys:

1. **Comment out reCAPTCHA keys in `.env.local`:**
   ```bash
   # NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-actual-site-key
   # RECAPTCHA_SECRET_KEY=your-actual-secret-key
   ```
2. **Restart development server:** `npm run dev`
3. **Navigate to `/contact`**
4. **Expected Result:** "Contact form is not available." message displayed

### Missing Email Configuration

Test that the form handles missing email service configuration:

1. **Comment out email keys in `.env.local`:**
   ```bash
   # RESEND_API_KEY=your-resend-api-key-here
   # FROM_EMAIL=your-contact@email.com
   # TO_EMAIL=your-inbox@email.com
   ```
2. **Restart development server:** `npm run dev`
3. **Try submitting the form**
4. **Expected Result:** "Server configuration error" message

## Rate Limiting Testing (Optional)

Rate limiting is fully covered by integration tests, but you can manually verify it works:

1. **Submit the contact form 6 times rapidly** from the same browser
2. **Expected Result:** After 5 submissions, you should see "Too many requests. Please try again later."
3. **Note:** Rate limits reset after 10 minutes, or use a different browser/incognito to test with a fresh IP

## Testing with Real External Services

### Email Service Integration

Test the complete email flow with real Resend service:

1. **Configure real Resend API key** in `.env.local`
2. **Use a real email address** for `TO_EMAIL`
3. **Submit the contact form**
4. **Verify email delivery, formatting, and reply-to functionality**

### reCAPTCHA Integration

Test with real Google reCAPTCHA service:

1. **Configure real reCAPTCHA keys** in `.env.local`
2. **Test form submission** behaves normally
3. **Optional:** Verify reCAPTCHA analytics in Google console

## Important Notes

### What's Covered by Automated Tests

The following scenarios are **fully covered by automated tests** and don't need manual testing:

- ✅ **Form validation errors** (empty fields, email mismatch, etc.)
- ✅ **Rate limiting behavior** (basic functionality and edge cases)
- ✅ **Network error handling**
- ✅ **Basic form submission flow**
- ✅ **reCAPTCHA bypass for testing**

### Restoring Normal Operation

After testing with modified environment variables:

1. **Restore your `.env.local` file** by uncommenting original values and removing test values
2. **Restart your development server:** `npm run dev`
