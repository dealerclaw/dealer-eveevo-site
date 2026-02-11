import fs from 'fs';
import { getDb } from './server/db';
import { dealers, cars } from './drizzle/schema';
import { eq } from 'drizzle-orm';

// Read dealers JSON
const dealersData = JSON.parse(fs.readFileSync('/home/ubuntu/dealers_import.json', 'utf8'));

console.log(`Importing ${dealersData.length} dealers...`);

let created = 0;
let errors = 0;
let carsAssigned = 0;

async function importDealers() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  for (const dealerInfo of dealersData) {
    try {
      // Create dealer account
      const result = await db.insert(dealers).values({
        firebaseId: dealerInfo.seller_id.toString(),
        name: dealerInfo.name,
        email: dealerInfo.email,
        phone: dealerInfo.phone,
        whatsappNumber: dealerInfo.whatsapp,
        profileUrl: dealerInfo.profile_url,
        address: dealerInfo.address,
        isVerified: true,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      });
      
      const dealerId = Number(result.insertId);
      created++;
      
      // Assign cars to dealer
      if (dealerInfo.car_ids && dealerInfo.car_ids.length > 0) {
        for (const carFirebaseId of dealerInfo.car_ids) {
          try {
            // Update car with dealer ID (match by firebaseId)
            await db.update(cars)
              .set({ dealerId: dealerId })
              .where(eq(cars.firebaseId, carFirebaseId));
            
            carsAssigned++;
          } catch (carError) {
            // Car might not exist, skip
          }
        }
      }
      
      if (created % 50 === 0) {
        console.log(`Progress: ${created} dealers created, ${carsAssigned} cars assigned`);
      }
      
    } catch (error: any) {
      errors++;
      if (errors < 10) {
        console.error(`Error creating dealer ${dealerInfo.name}:`, error.message);
      }
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Dealers created: ${created}`);
  console.log(`Cars assigned: ${carsAssigned}`);
  console.log(`Errors: ${errors}`);
  
  process.exit(0);
}

importDealers();
