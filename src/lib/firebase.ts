import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD7SoOsjV26ciJNvWFm5FV8yqPQf8yLgy4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bian-janjian.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bian-janjian',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bian-janjian.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '172607264683',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:172607264683:web:1bbd80d75c9d150a09a4ee',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
