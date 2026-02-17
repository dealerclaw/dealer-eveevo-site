/**
 * Sync registration numbers from Firestore to MySQL
 * Updates the registrationNumber field in MySQL cars table with data from Firestore carAds collection
 */

import { collection, getDocs } from 'firebase/firestore';
import { db as firestore } from './client/src/lib/firebase';
import { getDb } from './server/db';
import { cars } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function syncRegistrations() {
  console.log('[RegistrationSync] Starting sync from Firestore...');
  
  const carsCollection = collection(firestore, 'carAds');
  const snapshot = await getDocs(carsCollection);
  
  const db = await getDb();
  if (!db) {
    console.error('[RegistrationSync] Local database not available');
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  
  console.log(`[RegistrationSync] Processing ${snapshot.docs.length} documents from Firestore...`);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Try to get registration from various possible field names
    const registration = data.carReg || data.registrationNumber || data.regNumber || data.reg;
    
    if (!registration) {
      skippedCount++;
      continue;
    }
    
    try {
      // Find car by firebaseId
      const existing = await db.select().from(cars).where(eq(cars.firebaseId, docSnap.id)).limit(1);
      
      if (existing.length === 0) {
        notFoundCount++;
        continue;
      }
      
      // Update registration number
      await db.update(cars)
        .set({ registrationNumber: registration })
        .where(eq(cars.firebaseId, docSnap.id));
      
      updatedCount++;
      
      if (updatedCount % 100 === 0) {
        console.log(`[RegistrationSync] Updated ${updatedCount} registrations...`);
      }
    } catch (error: any) {
      console.error(`[RegistrationSync] Error updating car ${docSnap.id}:`, error.message);
    }
  }
  
  console.log('\n=== Registration Sync Results ===');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (no registration in Firestore): ${skippedCount}`);
  console.log(`Not found in MySQL: ${notFoundCount}`);
  console.log(`Total processed: ${snapshot.docs.length}`);
}

syncRegistrations()
  .then(() => {
    console.log('[RegistrationSync] Sync completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[RegistrationSync] Sync failed:', error);
    process.exit(1);
  });
