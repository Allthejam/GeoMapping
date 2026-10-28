'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * @fileOverview Hardened Firebase Authentication Hook.
 * Manages verified user sessions and loading states.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        // Only valid Firebase users are recognized in production
        setUser(firebaseUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If auth isn't initialized, we remain in a loading/null state
      setLoading(false);
    }
  }, [auth]);

  return { user, loading };
}
