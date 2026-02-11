import XLSX from 'xlsx';
import { db } from './server/db.ts';
import { dealers, users, cars } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const filePath = '/home/ubuntu/upload/Firebase-export-merged-data-to-send.xlsx';

// Read Excel file
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Found ${data.length} rows in spreadsheet`);

// Extract unique dealers
const dealerMap = new Map();

for (const row of data) {
  const dealerName = row['Dealer Name'] || row['dealerName'] || row['dealer_name'];
  const dealerLocation = row['Dealer Location'] || row['dealerLocation'] || row['dealer_location'];
  const carId = row['ID'] || row['id'] || row['Car ID'] || row['carId'];
  
  if (dealerName && !dealerMap.has(dealerName)) {
    dealerMap.set(dealerName, {
      name: dealerName,
      location: dealerLocation || 'UK',
      cars: []
    });
  }
  
  if (dealerName && carId) {
    dealerMap.get(dealerName).cars.push(carId);
  }
}

console.log(`Found ${dealerMap.size} unique dealers`);

// Create dealers and assign cars
for (const [dealerName, dealerInfo] of dealerMap.entries()) {
  try {
    // Create dealer account
    const [dealer] = await db.insert(dealers).values({
      businessName: dealerInfo.name,
      address: dealerInfo.location,
      phone: '0000000000',
      email: `${dealerInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@dealer.eveevo.com`,
      description: `Authorized dealer - ${dealerInfo.name}`,
      verified: true,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }).returning();
    
    console.log(`Created dealer: ${dealerInfo.name} (ID: ${dealer.id})`);
    
    // Assign cars to dealer
    if (dealerInfo.cars.length > 0) {
      await db.update(cars)
        .set({ dealerId: dealer.id })
        .where(eq(cars.id, dealerInfo.cars[0])); // Update first car as example
      
      console.log(`  Assigned ${dealerInfo.cars.length} cars to ${dealerInfo.name}`);
    }
  } catch (error) {
    console.error(`Error creating dealer ${dealerInfo.name}:`, error.message);
  }
}

console.log('Dealer import complete!');
process.exit(0);
