'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';

export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [instances, setInstances] = useState<{
    firebaseApp: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
    storage: FirebaseStorage | null;
  }>(() => {
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return { firebaseApp: null, firestore: null, auth: null, storage: null };
  });

  useEffect(() => {
    if (!instances.auth) {
      const res = initializeFirebase();
      setInstances(res);
    }
  }, [instances.auth]);

  return (
    <FirebaseProvider 
      firebaseApp={instances?.firebaseApp || null} 
      firestore={instances?.firestore || null} 
      auth={instances?.auth || null}
      storage={instances?.storage || null}
    >
      {children}
    </FirebaseProvider>
  );
}
