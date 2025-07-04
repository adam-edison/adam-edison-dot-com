import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ContactFormInner } from './ContactFormInner';

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    return (
      <div className={`${className} bg-red-950 border border-red-800 rounded-lg p-8 text-center`}>
        <p className="text-red-300">Contact form is not available. Please check the reCAPTCHA configuration.</p>
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <ContactFormInner className={className} />
    </GoogleReCaptchaProvider>
  );
}
