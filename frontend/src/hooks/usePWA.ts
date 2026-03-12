import { useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  isStandalone,
  canShowInstallPrompt,
  showInstallPrompt,
  checkForUpdates,
  skipWaiting,
  setupInstallPrompt,
} from '@/utils/pwa';

export interface PWAState {
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
  isOnline: boolean;
  serviceWorkerRegistered: boolean;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstalled: isStandalone(),
    isUpdateAvailable: false,
    canInstall: false,
    isOnline: navigator.onLine,
    serviceWorkerRegistered: false,
  });

  useEffect(() => {
    setupInstallPrompt();

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = () => {
      setState((prev) => ({ ...prev, canInstall: true }));
    };

    const handleAppInstalled = () => {
      setState((prev) => ({ ...prev, isInstalled: true, canInstall: false }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    registerServiceWorker({
      onSuccess: () => {
        setState((prev) => ({ ...prev, serviceWorkerRegistered: true }));
      },
      onUpdate: () => {
        setState((prev) => ({ ...prev, isUpdateAvailable: true }));
      },
    });

    const checkInterval = setInterval(async () => {
      const hasUpdate = await checkForUpdates();
      if (hasUpdate) {
        setState((prev) => ({ ...prev, isUpdateAvailable: true }));
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(checkInterval);
    };
  }, []);

  const install = useCallback(async () => {
    if (canShowInstallPrompt()) {
      const accepted = await showInstallPrompt();
      return accepted;
    }
    return false;
  }, []);

  const update = useCallback(() => {
    skipWaiting();
    window.location.reload();
  }, []);

  return {
    ...state,
    install,
    update,
  };
};

export default usePWA;
