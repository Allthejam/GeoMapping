'use client';

/**
 * Firebase configuration object.
 * Values are pulled from environment variables.
 * Note: These variables must be prefixed with NEXT_PUBLIC_ to be accessible in the browser.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAMtQQejHyWFtrsAjTHnEh9KCojzztwijU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-187291867-24746.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-187291867-24746",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-187291867-24746.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "237949144195",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:237949144195:web:c663fad1fe4c0f973b5fb6",
};
