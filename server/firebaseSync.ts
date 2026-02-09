/**
 * Firebase Sync Service
 * Syncs data between Firebase and local database
 */

import { collection, getDocs, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ref, get, onValue } from 'firebase/database';
import { db as firestore, realtimeDb } from '../client/src/lib/firebase';
import * as localDb from './db';
import { getDb } from './db';
import { cars, dealers } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Sync cars from Firebase Firestore to local database
 */
export async function syncCarsFromFirebase() {
  try {
    console.log('[FirebaseSync] Starting car sync from Firestore...');
    
    const carsCollection = collection(firestore, 'carAds');
    const snapshot = await getDocs(carsCollection);
    
    const db = await getDb();
    if (!db) {
      console.error('[FirebaseSync] Local database not available');
      return;
    }

    let syncedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Map Firebase data to local schema
      const carData: any = {
        firebaseId: docSnap.id,
        make: data.make || data.carMake || '',
        model: data.model || data.carModel || '',
        year: data.year ? parseInt(data.year) : null,
        price: data.price ? data.price.toString() : null,
        mileage: data.mileage ? parseInt(data.mileage) : null,
        condition: data.condition === 'new' ? 'new' as const : 'used' as const,
        bodyType: data.bodyType || null,
        color: data.color || data.colour || null,
        fuelType: 'Electric', // All are EVs
        transmission: data.transmission || 'Automatic',
        
        // EV specific
        batteryCapacity: data.batteryCapacity ? data.batteryCapacity.toString() : null,
        range: data.range ? parseInt(data.range) : null,
        chargingTime: data.chargingTime || null,
        acceleration: data.acceleration || null,
        topSpeed: data.topSpeed ? parseInt(data.topSpeed) : null,
        power: data.power ? parseInt(data.power) : null,
        
        // Images
        images: data.images || data.imageUrls || [],
        mainImage: data.mainImage || (data.images && data.images[0]) || null,
        
        // Additional info
        description: data.description || null,
        features: data.features || [],
        vin: data.vin || null,
        registrationNumber: data.registrationNumber || data.regNumber || null,
        
        // Status
        isAvailable: data.isAvailable !== false,
        isFeatured: data.isFeatured === true,
        
        // Dealer reference
        dealerId: data.dealerId ? parseInt(data.dealerId) : null,
      };

      // Upsert car (insert or update if exists)
      try {
        const existing = await db.select().from(cars).where(eq(cars.firebaseId, docSnap.id)).limit(1);
        
        if (existing.length > 0) {
          await db.update(cars).set(carData).where(eq(cars.firebaseId, docSnap.id));
        } else {
          await db.insert(cars).values(carData);
        }
        
        syncedCount++;
      } catch (error) {
        console.error(`[FirebaseSync] Error syncing car ${docSnap.id}:`, error);
      }
    }
    
    console.log(`[FirebaseSync] Synced ${syncedCount} cars from Firestore`);
    return syncedCount;
  } catch (error) {
    console.error('[FirebaseSync] Error syncing cars:', error);
    throw error;
  }
}

/**
 * Sync dealers from Firebase Firestore to local database
 */
export async function syncDealersFromFirebase() {
  try {
    console.log('[FirebaseSync] Starting dealer sync from Firestore...');
    
    // Assuming dealers are in a 'dealers' collection
    const dealersCollection = collection(firestore, 'dealers');
    const snapshot = await getDocs(dealersCollection);
    
    const db = await getDb();
    if (!db) {
      console.error('[FirebaseSync] Local database not available');
      return;
    }

    let syncedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      const dealerData: any = {
        firebaseId: docSnap.id,
        name: data.name || '',
        description: data.description || null,
        address: data.address || null,
        city: data.city || null,
        postcode: data.postcode || null,
        latitude: data.latitude ? data.latitude.toString() : null,
        longitude: data.longitude ? data.longitude.toString() : null,
        phone: data.phone || null,
        email: data.email || null,
        whatsappNumber: data.whatsappNumber || null,
        website: data.website || null,
        logoUrl: data.logoUrl || data.logo || null,
        rating: data.rating ? data.rating.toString() : null,
        isVerified: data.isVerified === true,
      };

      try {
        const existing = await db.select().from(dealers).where(eq(dealers.firebaseId, docSnap.id)).limit(1);
        
        if (existing.length > 0) {
          await db.update(dealers).set(dealerData).where(eq(dealers.firebaseId, docSnap.id));
        } else {
          await db.insert(dealers).values(dealerData);
        }
        
        syncedCount++;
      } catch (error) {
        console.error(`[FirebaseSync] Error syncing dealer ${docSnap.id}:`, error);
      }
    }
    
    console.log(`[FirebaseSync] Synced ${syncedCount} dealers from Firestore`);
    return syncedCount;
  } catch (error) {
    console.error('[FirebaseSync] Error syncing dealers:', error);
    throw error;
  }
}

/**
 * Get EV specifications from Firebase Realtime Database
 */
export async function getEvSpecsFromFirebase(make?: string, model?: string) {
  try {
    const evDbRef = ref(realtimeDb, 'evDatabaseRaw');
    const snapshot = await get(evDbRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const data = snapshot.val();
    let specs = Array.isArray(data) ? data : Object.values(data);
    
    // Filter by make and model if provided
    if (make) {
      specs = specs.filter((spec: any) => 
        spec.Vehicle_Make?.toLowerCase() === make.toLowerCase()
      );
    }
    
    if (model) {
      specs = specs.filter((spec: any) => 
        spec.Vehicle_Model?.toLowerCase().includes(model.toLowerCase())
      );
    }
    
    return specs;
  } catch (error) {
    console.error('[FirebaseSync] Error getting EV specs:', error);
    return [];
  }
}

/**
 * Get car makes from Firebase Realtime Database
 */
export async function getCarMakesFromFirebase() {
  try {
    const makesRef = ref(realtimeDb, 'car/car_make');
    const snapshot = await get(makesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const data = snapshot.val();
    return Array.isArray(data) ? data : Object.values(data);
  } catch (error) {
    console.error('[FirebaseSync] Error getting car makes:', error);
    return [];
  }
}

/**
 * Get car models from Firebase Realtime Database
 */
export async function getCarModelsFromFirebase(makeId: string) {
  try {
    const modelsRef = ref(realtimeDb, 'car/car_model');
    const snapshot = await get(modelsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const data = snapshot.val();
    const allModels = Array.isArray(data) ? data : Object.values(data);
    
    // Filter by make ID
    return allModels.filter((model: any) => model.id_car_make === makeId);
  } catch (error) {
    console.error('[FirebaseSync] Error getting car models:', error);
    return [];
  }
}

/**
 * Initialize Firebase sync - run on server startup
 */
export async function initializeFirebaseSync() {
  console.log('[FirebaseSync] Initializing Firebase sync...');
  
  try {
    // Initial sync
    await syncDealersFromFirebase();
    await syncCarsFromFirebase();
    
    console.log('[FirebaseSync] Initial sync completed');
    
    // Set up periodic sync every 5 minutes
    setInterval(async () => {
      console.log('[FirebaseSync] Running periodic sync...');
      await syncDealersFromFirebase();
      await syncCarsFromFirebase();
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('[FirebaseSync] Error initializing sync:', error);
  }
}
