import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAHXp-zzjBJI0Hfq3Jj8GhNJZYtxPRQqzI",
  authDomain: "eveevo-af2fa.firebaseapp.com",
  databaseURL: "https://eveevo-af2fa-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "eveevo-af2fa",
  storageBucket: "eveevo-af2fa.firebasestorage.app",
  messagingSenderId: "1048733485610",
  appId: "1:1048733485610:web:d1b7e4e9e8b9c8a7f3e2d1",
  measurementId: "G-XXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

console.log('[Test] Connecting to Firebase...');

try {
  const carsCollection = collection(firestore, 'carAds');
  const q = query(carsCollection, limit(5));
  const snapshot = await getDocs(q);
  
  console.log(`[Test] Found ${snapshot.size} cars in Firebase`);
  
  snapshot.docs.forEach((doc, idx) => {
    console.log(`\nCar ${idx + 1}:`, JSON.stringify(doc.data(), null, 2));
  });
  
} catch (error) {
  console.error('[Test] Error:', error);
}

process.exit(0);
