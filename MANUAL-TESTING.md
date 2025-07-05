# Manual Testing Guide

This document provides comprehensive instructions for manually testing the contact form, including both happy path scenarios and error conditions.

## Basic Form Testing (Happy Path)

1. **Ensure all environment variables are set** in your `.env.local` file
2. **Start the development server:** `npm run dev`
3. **Navigate to `/contact`**
4. **Fill out and submit the form** with valid information
5. **Check your configured email address** for the message
6. **Expected Result:** Success message with "Message Sent!" and option to send another

## Testing Error Scenarios

### reCAPTCHA Failures

### Method 1: Use Invalid reCAPTCHA Secret Key (Recommended)

Test actual reCAPTCHA API failure by using an invalid secret key:

1. **Open your `.env.local` file**
2. **Comment out your real secret key and add an invalid one:**
   ```bash
   # RECAPTCHA_SECRET_KEY=your-actual-secret-key
   RECAPTCHA_SECRET_KEY=invalid-secret-key-for-testing
   ```
3. **Restart your development server:**
   ```bash
   npm run dev
   ```
4. **Fill out and submit the contact form**
5. **Expected Result:** "Security verification failed. Please refresh the page and try again."

### Method 2: Test reCAPTCHA Score Threshold

Test reCAPTCHA v3 score-based rejection by setting a very high threshold:

1. **Open your `.env.local` file**
2. **Comment out your current threshold and add a high one:**
   ```bash
   # RECAPTCHA_SCORE_THRESHOLD=0.5
   RECAPTCHA_SCORE_THRESHOLD=0.9
   ```
3. **Restart your development server:**
   ```bash
   npm run dev
   ```
4. **Fill out and submit the contact form**
5. **Expected Result:** "Security verification failed. Please refresh the page and try again."
   _(Most legitimate traffic scores below 0.9, so this will likely fail)_

### Method 3: Test Missing Secret Key Configuration

To test missing reCAPTCHA secret key:

1. **Open your `.env.local` file**
2. **Comment out the RECAPTCHA_SECRET_KEY line:**
   ```bash
   # RECAPTCHA_SECRET_KEY=your-actual-secret-key
   ```
3. **Restart your development server:**
   ```bash
   npm run dev
   ```
4. **Navigate to the contact form**
5. **Expected Result:** You should see: "Contact form is not available."
   _(No need to fill out form)_

### Method 4: Test Missing Site Key Configuration

To test the "reCAPTCHA not ready" scenario:

1. **Open your `.env.local` file**
2. **Comment out the NEXT_PUBLIC_RECAPTCHA_SITE_KEY line:**
   ```bash
   # NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-actual-site-key
   ```
3. **Restart your development server:**
   ```bash
   npm run dev
   ```
4. **Navigate to the contact form**
5. **Expected Result:** You should see: "Contact form is not available."
   _(No need to fill out form)_

## Additional Manual Tests

### Form Validation Errors

- **Test:** Submit empty form
- **Expected:** Field validation errors appear below each required field

### Email Mismatch Validation

- **Test:** Enter different email addresses in the email and confirm email fields
- **Expected:** "Email addresses must match" validation error

### Network Errors

- **Test:** Disconnect internet and submit form
- **Expected:** "Network error" message appears

## Error Boundary Testing

The contact form includes an error boundary that catches unexpected React errors:

1. **To trigger:** Cause a React rendering error (modify component to throw)
2. **Expected:** Friendly error message with "Refresh Page" button
3. **Recovery:** Click "Refresh Page" to reload the application

## Restoring Normal Operation

After testing, remember to:

1. **Restore your `.env.local` file by uncommenting original values and removing test values:**
   ```bash
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-actual-site-key
   RECAPTCHA_SECRET_KEY=your-actual-secret-key
   RECAPTCHA_SCORE_THRESHOLD=0.5
   ```
2. **Restart your development server:**
   ```bash
   npm run dev
   ```
