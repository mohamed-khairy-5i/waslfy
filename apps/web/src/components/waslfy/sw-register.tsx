'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker — production builds only,
 * so `next dev` never fights with a stale cache.
 */
export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    const register = () => {
      navigator.serviceWorker.register(`${bp}/sw.js`).catch(() => {
        /* offline support is progressive — never block the app */
      });
    };

    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
