'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function ServiceWorkerRegister() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    // 1. Initial online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setShowOfflineNotice(false);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setShowOfflineNotice(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // 2. Register Service Worker in production / supported environments
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
              console.log('[SW] Registered successfully with scope:', registration.scope);
            })
            .catch((error) => {
              console.warn('[SW] Registration failed:', error);
            });
        });
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (!showOfflineNotice && isOnline) return null;

  return (
    <aside 
      aria-label="Network status notification"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:left-6 md:translate-x-0 z-[9999] pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="bg-background/95 backdrop-blur-md border border-amber-500/30 text-foreground px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          <WifiOff className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-black tracking-tight leading-none">
            Field Offline Mode
          </div>
          <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
            Operating from local cache & stored survey data
          </div>
        </div>
      </div>
    </aside>
  );
}
