'use client';

import { useEffect } from 'react';

export default function PWAInstaller() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // ログは ErrorSuppressor で統合制御される
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Service Worker registration failed:', error);
          }
        });
    }
  }, []);

  return null;
}
