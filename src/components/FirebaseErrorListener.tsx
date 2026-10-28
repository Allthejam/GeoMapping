'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { toast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: any) => {
      console.warn('[Firestore Operation Notice]', error?.message || error);
      if (process.env.NODE_ENV === 'development') {
        console.error(error);
      }
      // Notify cleanly without throwing unhandled exceptions that break the React component tree
      if (error?.message?.includes('Missing or insufficient permissions')) {
        toast({
          variant: "destructive",
          title: "Permission Notice",
          description: "Database permission check failed. Please verify that Firestore Security Rules are active in your Firebase Console."
        });
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
