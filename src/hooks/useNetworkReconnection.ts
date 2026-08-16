import { useState, useEffect, useCallback } from 'react';

export interface UseNetworkReconnectionOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  autoPingUrl?: string;
  pingIntervalMs?: number;
}

export function useNetworkReconnection(options: UseNetworkReconnectionOptions = {}) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);
    setReconnectAttempts((prev) => prev + 1);
    console.log('[Network] Dispozitivul a revenit ONLINE. Se reia conexiunea...');
    if (options.onOnline) {
      options.onOnline();
    }
  }, [options]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    console.warn('[Network] Conexiunea a căzut (OFFLINE).');
    if (options.onOffline) {
      options.onOffline();
    }
  }, [options]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also monitor visibility (e.g. app reopened from background on Android)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        handleOnline();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    reconnectAttempts,
    resetWasOffline: () => setWasOffline(false),
  };
}
