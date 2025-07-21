let loadPromise: Promise<void> | null = null;

export const loadTurnstileScript = (): Promise<void> => {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.turnstile) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for turnstile to be ready
      if (window.turnstile && window.turnstile.ready) {
        window.turnstile.ready(() => {
          resolve();
        });
      } else {
        // Fallback if ready method doesn't exist
        resolve();
      }
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Cloudflare Turnstile script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};
