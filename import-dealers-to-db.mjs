import fs from 'fs';
import { db } from './server/db.ts';
import { dealers, cars } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

// Read dealers JSON
const dealersData = JSON.parse(fs.readFileSync('/home/ubuntu/dealers_import.json', 'utf8'));

console.log(`Importing ${dealersData.length} dealers...`);

let created = 0;
let errors = 0;
let carsAssigned = 0;

for (const dealerInfo of dealersData) {
  try {
    // Create dealer account
    const [dealer] = await db.insert(dealers).values({
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
    }).returning();
    
    created++;
    
    // Assign cars to dealer
    if (dealerInfo.car_ids && dealerInfo.car_ids.length > 0) {
      for (const carFirebaseId of dealerInfo.car_ids) {
        try {
          // Update car with dealer ID (match by firebaseId)
          const result = await db.update(cars)
            .set({ dealerId: dealer.id })
            .where(eq(cars.firebaseId, carFirebaseId));
          
          if (result.rowsAffected > 0) {
            carsAssigned++;
          }
        } catch (carError) {
          // Car might not exist, skip
        }
      }
    }
    
    if (created % 50 === 0) {
      console.log(`Progress: ${created} dealers created, ${carsAssigned} cars assigned`);
    }
    
  } catch (error) {
    errors++;
    console.error(`Error creating dealer ${dealerInfo.name}:`, error.message);
  }
}

console.log(`\n=== Import Complete ===`);
console.log(`Dealers created: ${created}`);
console.log(`Cars assigned: ${carsAssigned}`);
console.log(`Errors: ${errors}`);

process.exit(0);
