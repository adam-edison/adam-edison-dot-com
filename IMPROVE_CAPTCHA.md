Yes, absolutely! Implementing a fallback to reCAPTCHA v2 (the image challenge) when v3 fails is a much better user experience and is actually a common industry practice. Let me show you how to implement this.
Search files...

Here's how to implement a fallback to reCAPTCHA v2 (the image challenge) when v3 fails. This provides a much better user experience:

## Implementation Plan

### 1. **Install reCAPTCHA v2 Package**

```bash
npm install react-google-recaptcha @types/react-google-recaptcha
```

### 2. **Environment Variables**

You'll need separate keys for v2 and v3. Add to your `.env.local`:

```env
# reCAPTCHA v3 (existing)
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=your-v3-site-key
RECAPTCHA_V3_SECRET_KEY=your-v3-secret-key

# reCAPTCHA v2 (new)
NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY=your-v2-site-key
RECAPTCHA_V2_SECRET_KEY=your-v2-secret-key

# Threshold for v3 fallback
RECAPTCHA_SCORE_THRESHOLD=0.3
```

### 3. **Update Backend Verification**

Create an enhanced verification function that handles both v2 and v3:

```typescript:src/lib/api/recaptcha.ts
export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  requiresFallback?: boolean;
  version?: 'v2' | 'v3';
}

// Enhanced verification function
export async function verifyRecaptcha(
  token: string,
  version: 'v2' | 'v3' = 'v3'
): Promise<RecaptchaVerificationResult> {
  // Skip verification in test mode
  if (process.env.RECAPTCHA_SCORE_THRESHOLD === '0') {
    return { success: true, version };
  }

  const secretKey = version === 'v3'
    ? process.env.RECAPTCHA_V3_SECRET_KEY
    : process.env.RECAPTCHA_V2_SECRET_KEY;

  if (!secretKey) {
    throw new Error(`reCAPTCHA ${version} secret key not configured`);
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();

    if (!data.success) {
      console.error(`reCAPTCHA ${version} verification failed:`, data['error-codes']);
      return { success: false, version };
    }

    // reCAPTCHA v2 passes if verification is successful
    if (version === 'v2') {
      return { success: true, version };
    }

    // reCAPTCHA v3 - check score
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
    const score = data.score || 0;

    if (score < scoreThreshold) {
      console.log(`reCAPTCHA v3 score too low (${score}), fallback to v2 recommended`);
      return {
        success: false,
        score,
        requiresFallback: true,
        version
      };
    }

    return { success: true, score, version };
  } catch (error) {
    console.error(`Error verifying reCAPTCHA ${version}:`, error);
    return { success: false, version };
  }
}
```

### 4. **Update API Endpoint**

Modify your contact API to handle both types and return fallback information:

```typescript:src/pages/api/contact.ts
// In your contact handler, around line 56:

const { recaptchaToken, recaptchaVersion, ...formData } = validationResult.data;

// Verify reCAPTCHA with version info
const recaptchaResult = await verifyRecaptcha(recaptchaToken, recaptchaVersion);

if (!recaptchaResult.success) {
  console.error('reCAPTCHA verification failed:', recaptchaResult);

  // If v3 failed and fallback is recommended, tell the frontend
  if (recaptchaResult.requiresFallback) {
    return res.status(400).json({
      message: 'reCAPTCHA verification failed',
      requiresFallback: true
    });
  }

  return res.status(400).json({ message: 'reCAPTCHA verification failed' });
}

// Continue with rest of the flow...
```

### 5. **Update Validation Schema**

Add support for version parameter:

```typescript:src/lib/validations/contact.ts
// Full schema with reCAPTCHA token for API submission
export const contactFormSubmissionSchema = baseContactSchema
  .extend({
    recaptchaToken: z.string().min(1, 'Please complete the reCAPTCHA verification'),
    recaptchaVersion: z.enum(['v2', 'v3']).default('v3')
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: 'Email addresses must match',
    path: ['confirmEmail']
  });
```

### 6. **Create Enhanced Contact Form Component**

Update your contact form to handle both v2 and v3:

```typescript:src/components/contact/ContactFormInner.tsx
import React, { useState, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import ReCAPTCHA from 'react-google-recaptcha';
import { contactFormSchema, ContactFormData } from '@/lib/validations/contact';

// ... existing imports ...

export function ContactFormInner({ className }: ContactFormInnerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showV2Challenge, setShowV2Challenge] = useState(false);
  const [v2Token, setV2Token] = useState<string | null>(null);

  const { executeRecaptcha } = useGoogleReCaptcha();
  const recaptchaV2Ref = useRef<ReCAPTCHA>(null);

  // ... existing form setup ...

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      let recaptchaToken: string;
      let recaptchaVersion: 'v2' | 'v3';

      if (showV2Challenge) {
        // Use v2 token if challenge is shown
        if (!v2Token) {
          setErrorMessage('Please complete the reCAPTCHA challenge.');
          setIsSubmitting(false);
          return;
        }
        recaptchaToken = v2Token;
        recaptchaVersion = 'v2';
      } else {
        // Try v3 first
        if (!executeRecaptcha) {
          setErrorMessage('reCAPTCHA not ready. Please try again.');
          setIsSubmitting(false);
          return;
        }
        recaptchaToken = await executeRecaptcha('contact_form');
        recaptchaVersion = 'v3';
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          recaptchaToken,
          recaptchaVersion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        // If v3 failed and fallback is recommended, show v2 challenge
        if (errorData.requiresFallback && !showV2Challenge) {
          setShowV2Challenge(true);
          setErrorMessage('Additional verification required. Please complete the challenge below.');
          setIsSubmitting(false);
          return;
        }

        setSubmitStatus('error');
        let friendlyMessage = errorData.message || 'Failed to send message';
        if (friendlyMessage.includes('reCAPTCHA')) {
          friendlyMessage = 'Security verification failed. Please try again.';
        }
        setErrorMessage(friendlyMessage);
        setIsSubmitting(false);
        return;
      }

      setSubmitStatus('success');
      reset();
      setShowV2Challenge(false);
      setV2Token(null);
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleV2Change = (token: string | null) => {
    setV2Token(token);
    if (token) {
      setErrorMessage(''); // Clear error when challenge is completed
    }
  };

  const handleV2Error = () => {
    setErrorMessage('reCAPTCHA verification failed. Please try again.');
    setV2Token(null);
  };

  const handleV2Expired = () => {
    setV2Token(null);
    setErrorMessage('reCAPTCHA expired. Please complete the challenge again.');
  };

  // ... existing success check ...

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${className} space-y-6`}>
      {submitStatus === 'error' && errorMessage && (
        <StatusCard variant="error" message={errorMessage} showIcon />
      )}

      {/* ... existing form fields ... */}

      {/* reCAPTCHA v2 Challenge - only shown when needed */}
      {showV2Challenge && (
        <div className="space-y-4">
          <div className="border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400 mb-4">
              Additional verification required:
            </p>
            <ReCAPTCHA
              ref={recaptchaV2Ref}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY!}
              onChange={handleV2Change}
              onError={handleV2Error}
              onExpired={handleV2Expired}
              theme="dark" // Match your site's theme
            />
          </div>
        </div>
      )}

      <RecaptchaNotice />
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
```

### 7. **Update Environment Configuration**

Update your config check to include v2 keys:

```typescript:src/pages/api/config-check.ts
const requiredEnvVars = [
  { name: 'RECAPTCHA_V3_SECRET_KEY', value: process.env.RECAPTCHA_V3_SECRET_KEY },
  { name: 'RECAPTCHA_V2_SECRET_KEY', value: process.env.RECAPTCHA_V2_SECRET_KEY },
  { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
  { name: 'FROM_EMAIL', value: process.env.FROM_EMAIL },
  { name: 'TO_EMAIL', value: process.env.TO_EMAIL }
];
```

### 8. **Update Contact Form Container**

Update the main contact form to use the new environment variable names:

```typescript:src/components/contact/ContactForm.tsx
export function ContactForm({ className }: ContactFormProps) {
  const [configStatus, setConfigStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY; // Updated variable name

  // ... rest of component
}
```

## Setup Instructions

1. **Create reCAPTCHA v2 Keys**: Visit [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin/create) and create a reCAPTCHA v2 site for your domain.

2. **Update Environment**: Add the new environment variables to your `.env.local`.

3. **Test the Flow**:
   - Use 1Password to autofill (should trigger v2 fallback)
   - Complete the image challenge
   - Form should submit successfully

## Benefits of This Approach

- **Better UX**: Users aren't blocked, just asked to complete one more step
- **Maintains Security**: Still protects against bots
- **Transparent**: Users understand what's happening
- **Fallback Safety**: If v3 fails entirely, v2 provides backup
- **Password Manager Friendly**: Accommodates legitimate users with autofill tools

This implementation gives you the best of both worlds: invisible protection for most users, with a clear path forward for those who need additional verification.
