import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration from the Flutter app
const firebaseConfig = {
  apiKey: "AIzaSyBoTEAkJEPZys2K0vmMySP6YdgsfGCCL8Y",
  authDomain: "eveevo-af2fa.firebaseapp.com",
  databaseURL: "https://eveevo-af2fa-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "eveevo-af2fa",
  storageBucket: "eveevo-af2fa.appspot.com",
  messagingSenderId: "496138276614",
  appId: "1:496138276614:web:037fc74c2d213241479887",
  measurementId: "G-L2WNS88FMJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

export default app;
