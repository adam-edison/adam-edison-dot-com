// Singleton to ensure reCAPTCHA script loads only once
class ReCaptchaLoader {
  private static instance: ReCaptchaLoader;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;

  private constructor() {}

  static getInstance(): ReCaptchaLoader {
    if (!ReCaptchaLoader.instance) {
      ReCaptchaLoader.instance = new ReCaptchaLoader();
    }
    return ReCaptchaLoader.instance;
  }

  async load(siteKey: string): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded) {
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.loadPromise = new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="recaptcha"]');
      if (existingScript) {
        this.isLoaded = true;
        resolve();
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        this.loadPromise = null;
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  isScriptLoaded(): boolean {
    return this.isLoaded;
  }
}

export const recaptchaLoader = ReCaptchaLoader.getInstance();
