let loadPromise: Promise<void> | null = null;

const resolveImmediately = (resolve: () => void) => {
  resolve();
};

const resolveAfterDelay = (resolve: () => void, delay: number = 500) => {
  setTimeout(() => resolve(), delay);
};

const setupExistingScriptListeners = (existingScript: Element, resolve: () => void, reject: (error: Error) => void) => {
  existingScript.addEventListener('load', () => {
    if (window.turnstile) {
      resolveImmediately(resolve);
      return;
    }
    resolveAfterDelay(resolve);
  });

  existingScript.addEventListener('error', () => {
    reject(new Error('Failed to load existing Cloudflare Turnstile script'));
  });
};

const handleExistingScript = (existingScript: Element, resolve: () => void, reject: (error: Error) => void) => {
  if (window.turnstile) {
    resolveImmediately(resolve);
    return;
  }

  setupExistingScriptListeners(existingScript, resolve, reject);
};

const setupTurnstileReady = (resolve: () => void) => {
  const readyTimeout = setTimeout(() => resolve(), 2000);

  window.turnstile!.ready(() => {
    clearTimeout(readyTimeout);
    resolve();
  });
};

const handleScriptLoad = (resolve: () => void) => {
  if (!window.turnstile?.ready) {
    resolveAfterDelay(resolve);
    return;
  }

  setupTurnstileReady(resolve);
};

const setupScriptErrorHandler = (script: HTMLScriptElement, reject: (error: Error) => void) => {
  script.onerror = () => {
    loadPromise = null;
    reject(new Error('Failed to load Cloudflare Turnstile script'));
  };
};

const createTurnstileScript = (resolve: () => void, reject: (error: Error) => void) => {
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  script.async = true;
  script.defer = true;

  script.onload = () => handleScriptLoad(resolve);
  setupScriptErrorHandler(script, reject);

  document.head.appendChild(script);
};

const handleAlreadyLoaded = (resolve: () => void) => {
  resolveImmediately(resolve);
};

const handleExistingScriptFound = (existingScript: Element, resolve: () => void, reject: (error: Error) => void) => {
  handleExistingScript(existingScript, resolve, reject);
};

const handleNoExistingScript = (resolve: () => void, reject: (error: Error) => void) => {
  createTurnstileScript(resolve, reject);
};

const createLoadPromise = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.turnstile) {
      handleAlreadyLoaded(resolve);
      return;
    }

    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      handleExistingScriptFound(existingScript, resolve, reject);
      return;
    }

    handleNoExistingScript(resolve, reject);
  });
};

export const loadTurnstileScript = (): Promise<void> => {
  if (loadPromise) return loadPromise;

  loadPromise = createLoadPromise();
  return loadPromise;
};
