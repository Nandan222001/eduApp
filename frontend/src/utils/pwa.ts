export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export const registerServiceWorker = async (config?: ServiceWorkerConfig) => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', registration);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New content is available; please refresh.');
              config?.onUpdate?.(registration);
            } else if (newWorker.state === 'activated') {
              console.log('[PWA] Service Worker activated successfully');
              config?.onSuccess?.(registration);
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      config?.onError?.(error as Error);
      throw error;
    }
  } else {
    console.warn('[PWA] Service Workers not supported');
    return null;
  }
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.unregister();
    }

    console.log('[PWA] Service Worker unregistered');
  }
};

export const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      await registration.update();
      console.log('[PWA] Service Worker update check triggered');
    }
  }
};

export const skipWaiting = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
};

export const clearAllCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log('[PWA] All caches cleared');
  }
};

export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      await registration.update();
      return registration.waiting !== null;
    }
  }

  return false;
};

export const isStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
};

export const isInstallable = async (): Promise<boolean> => {
  if ('getInstalledRelatedApps' in navigator) {
    const relatedApps = await (
      navigator as { getInstalledRelatedApps: () => Promise<unknown[]> }
    ).getInstalledRelatedApps();
    return relatedApps.length === 0;
  }

  return !isStandalone();
};

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt ready');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
  });
};

export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  console.log(`[PWA] User ${outcome} the install prompt`);
  deferredPrompt = null;

  return outcome === 'accepted';
};

export const canShowInstallPrompt = (): boolean => {
  return deferredPrompt !== null;
};

export const getAppBadge = (): number | undefined => {
  if ('setAppBadge' in navigator) {
    return undefined;
  }
  return undefined;
};

export const setAppBadge = async (count: number = 0) => {
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await (navigator as { setAppBadge: (count: number) => Promise<void> }).setAppBadge(count);
      } else {
        await (navigator as { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }
    } catch (error) {
      console.error('[PWA] Failed to set app badge:', error);
    }
  }
};

export const clearAppBadge = async () => {
  if ('clearAppBadge' in navigator) {
    try {
      await (navigator as { clearAppBadge: () => Promise<void> }).clearAppBadge();
    } catch (error) {
      console.error('[PWA] Failed to clear app badge:', error);
    }
  }
};
