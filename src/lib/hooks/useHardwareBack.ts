'use client';

import { useEffect } from 'react';

interface HardwareBackOptions {
  onBack?: () => boolean | void; // return true to prevent default history back
  enabled?: boolean;
}

/**
 * Hook to handle Android hardware back button and browser history popping.
 * If Capacitor is present on window, registers with native App plugin.
 * Falls back to browser popstate listener for web & PWA.
 */
export function useHardwareBack({ onBack, enabled = true }: HardwareBackOptions = {}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 1. Check if running inside Capacitor Android container
    const capacitorApp = (
      window as unknown as {
        Capacitor?: {
          Plugins?: {
            App?: {
              addListener: (
                evt: string,
                fn: (data: { canGoBack: boolean }) => void,
              ) => { remove: () => void };
            };
          };
        };
      }
    ).Capacitor?.Plugins?.App;

    let cleanupCapacitorListener: (() => void) | undefined;

    if (capacitorApp && typeof capacitorApp.addListener === 'function') {
      const handle = capacitorApp.addListener('backButton', () => {
        const handled = onBack?.();
        if (!handled && window.history.length > 1) {
          window.history.back();
        }
      });
      cleanupCapacitorListener = () => handle?.remove?.();
    }

    // 2. Browser popstate fallback
    const handlePopState = () => {
      onBack?.();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      cleanupCapacitorListener?.();
    };
  }, [onBack, enabled]);
}
