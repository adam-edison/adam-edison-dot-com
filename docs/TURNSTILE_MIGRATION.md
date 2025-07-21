# Migrating from reCAPTCHA to Cloudflare Turnstile

This guide helps you migrate from Google reCAPTCHA to Cloudflare Turnstile for spam protection.

## Why Migrate?

- **Better Privacy**: Turnstile collects minimal data compared to reCAPTCHA
- **VPN-Friendly**: Works better for users behind VPNs or privacy tools
- **User Control**: Manual retry options give users more control
- **Performance**: Lighter weight and faster loading

## Migration Steps

### 1. Create Turnstile Widget

1. Visit [Cloudflare Turnstile Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Click "Add Widget"
3. Enter widget name (e.g., "Personal Website Contact Form")
4. Select **Managed** mode for checkbox verification
5. Add your domains:
   - `localhost` for development
   - Your production domain (e.g., `adamedison.com`)
6. Copy the Site Key and Secret Key

### 2. Update Environment Variables

Replace your reCAPTCHA configuration:

```bash
# Remove these old variables
# NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
# RECAPTCHA_SECRET_KEY=...
# RECAPTCHA_SCORE_THRESHOLD=...
# NEXT_PUBLIC_RECAPTCHA_TIMEOUT_MS=...

# Add these new variables
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
```

### 3. Update Production Environment

Update environment variables in your hosting platform:

- Netlify: Settings → Environment Variables
- Vercel: Settings → Environment Variables
- Other hosts: Check their documentation

### 4. Deploy Changes

The code changes have already been made. Simply deploy to activate Turnstile:

```bash
git pull
npm install
npm run build
```

## Feature Comparison

| Feature         | reCAPTCHA v3   | Turnstile (Checkbox)  |
| --------------- | -------------- | --------------------- |
| User Experience | Invisible      | Visible checkbox      |
| VPN Support     | Poor           | Excellent             |
| Privacy         | Tracks users   | Minimal tracking      |
| Retry Control   | Automatic      | Manual (user control) |
| Loading         | On form submit | On page load          |

## Configuration Details

The Turnstile widget is configured with VPN-friendly settings:

```javascript
{
  retry: 'never',           // Manual retry control
  'refresh-timeout': 'manual', // User controls refresh
  execution: 'render'       // Loads on page render
}
```

## Troubleshooting

### Widget Not Appearing

1. Check browser console for errors
2. Verify site key is correct in `.env.local`
3. Ensure domain is added to Turnstile widget

### Verification Failing

1. Check secret key is correct
2. Verify server can reach Cloudflare API
3. Check rate limiting isn't blocking requests

### VPN Users Having Issues

The checkbox mode is specifically chosen to be VPN-friendly. Users can:

- Manually retry if verification fails
- See clear feedback about verification status
- Control when to refresh the challenge

## Rollback Plan

If you need to rollback to reCAPTCHA:

1. Restore environment variables
2. Revert git commits:
   ```bash
   git revert 921fcb2  # Revert server-side changes
   git revert f1234567  # Revert client-side changes
   git revert a1234567  # Revert anti-bot removal
   ```

## Support

For Turnstile-specific issues:

- [Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Turnstile Community](https://community.cloudflare.com/c/security/turnstile/)
