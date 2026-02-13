import { drizzle } from "drizzle-orm/mysql2";
import { dealers, cars } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";
import XLSX from 'xlsx';

const db = drizzle(process.env.DATABASE_URL);

console.log("Starting Excel data import...\n");

// Read Excel file
const workbook = XLSX.readFile('/home/ubuntu/upload/Firebase-export-merged-data-to-send.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Loaded ${data.length} rows from Excel\n`);

// Step 1: Extract and import unique dealers
console.log("=".repeat(60));
console.log("STEP 1: Importing Dealers");
console.log("=".repeat(60));

const sellersMap = new Map();
for (const row of data) {
  const sellerId = row.sellerId;
  if (sellerId && !sellersMap.has(sellerId)) {
    sellersMap.set(sellerId, {
      firebaseId: String(sellerId),
      name: row.sellerName || 'Unknown Dealer',
      email: row.sellerEmail || null,
      phone: row.sellerPrimaryTel || null,
      whatsappNumber: row.sellerWhatAppTel || null,
      profileUrl: row.sellerProfileUrl || null,
      address: row.address || null,
      isVerified: row.sellerMembershipActive === true,
      subscriptionStatus: null, // All start as free tier
    });
  }
}

console.log(`Found ${sellersMap.size} unique dealers`);

let dealersImported = 0;
let dealersSkipped = 0;
const dealerIdMap = new Map(); // Maps external sellerId to internal dealer.id

for (const [sellerId, dealerData] of sellersMap) {
  try {
    // Check if dealer already exists by external ID
    const existing = await db.select().from(dealers).where(eq(dealers.firebaseId, dealerData.firebaseId)).limit(1);
    
    if (existing.length > 0) {
      dealersSkipped++;
      dealerIdMap.set(sellerId, existing[0].id);
      continue;
    }

    // Insert new dealer (without userId since these are external dealers)
    const result = await db.insert(dealers).values({
      userId: null, // External dealers don't have user accounts yet
      firebaseId: dealerData.firebaseId,
      name: dealerData.name,
      email: dealerData.email,
      phone: dealerData.phone,
      whatsappNumber: dealerData.whatsappNumber,
      profileUrl: dealerData.profileUrl,
      address: dealerData.address,
      isVerified: dealerData.isVerified,
      subscriptionStatus: dealerData.subscriptionStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    dealerIdMap.set(sellerId, Number(result.insertId));
    dealersImported++;

    if (dealersImported % 50 === 0) {
      console.log(`  Imported ${dealersImported} dealers...`);
    }
  } catch (error) {
    console.error(`Error importing dealer ${sellerId}:`, error.message);
  }
}

console.log(`\nDealers imported: ${dealersImported}`);
console.log(`Dealers skipped (already exist): ${dealersSkipped}`);
console.log(`Total dealers in map: ${dealerIdMap.size}\n`);

// Step 2: Import cars with dealer assignments
console.log("=".repeat(60));
console.log("STEP 2: Importing Cars");
console.log("=".repeat(60));

let carsImported = 0;
let carsSkipped = 0;
let carsError = 0;

for (const row of data) {
  try {
    const sellerId = row.sellerId;
    const dealerId = dealerIdMap.get(sellerId);

    if (!dealerId) {
      carsError++;
      continue;
    }

    // Check if car already exists by advertId
    if (row.advertId) {
      const existing = await db.select().from(cars).where(eq(cars.firebaseId, String(row.advertId))).limit(1);
      if (existing.length > 0) {
        carsSkipped++;
        continue;
      }
    }

    // Parse price
    let price = null;
    if (row.price) {
      const priceNum = parseFloat(String(row.price).replace(/[^0-9.]/g, ''));
      if (!isNaN(priceNum)) {
        price = priceNum.toString();
      }
    }

    // Parse mileage
    let mileage = null;
    if (row.mileage) {
      const mileageNum = parseInt(String(row.mileage).replace(/[^0-9]/g, ''));
      if (!isNaN(mileageNum)) {
        mileage = mileageNum;
      }
    }

    // Parse year
    let year = null;
    if (row.year) {
      const yearNum = parseInt(row.year);
      if (!isNaN(yearNum) && yearNum > 1900 && yearNum <= new Date().getFullYear() + 1) {
        year = yearNum;
      }
    }

    // Parse battery capacity
    let batteryCapacity = null;
    if (row.Battery_Capacity_Full) {
      const batteryNum = parseFloat(row.Battery_Capacity_Full);
      if (!isNaN(batteryNum)) {
        batteryCapacity = batteryNum;
      }
    }

    // Parse real range
    let realRange = null;
    if (row.Range_Real) {
      const rangeNum = parseInt(row.Range_Real);
      if (!isNaN(rangeNum)) {
        realRange = rangeNum;
      }
    }

    // Determine condition
    let condition = 'used'; // Default to used since this is used car data
    if (row.condition) {
      condition = String(row.condition).toLowerCase() === 'new' ? 'new' : 'used';
    }

    // Parse image URLs
    let imageUrl = null;
    if (row.photoURLs && Array.isArray(row.photoURLs) && row.photoURLs.length > 0) {
      imageUrl = row.photoURLs[0];
    } else if (typeof row.photoURLs === 'string') {
      try {
        const urls = JSON.parse(row.photoURLs);
        if (Array.isArray(urls) && urls.length > 0) {
          imageUrl = urls[0];
        }
      } catch {
        imageUrl = row.photoURLs;
      }
    }

    // Insert car
    await db.insert(cars).values({
      dealerId: dealerId,
      firebaseId: row.advertId ? String(row.advertId) : null,
      make: row.make || row.Vehicle_Make || 'Unknown',
      model: row.model || row.Vehicle_Model_Version || 'Unknown',
      year: year,
      price: price,
      mileage: mileage,
      condition: condition,
      fuelType: row.fuel || 'Electric',
      transmission: row.trans || null,
      bodyType: row.bodyType || row.Misc_Segment || null,
      color: row.CarColour || null,
      description: row.ad_desc || row.ad_hdline || null,
      imageUrl: imageUrl,
      batteryCapacity: batteryCapacity,
      realRange: realRange,
      isAvailable: row.adStatus === 'Live',
      marketplace: 'consumer', // Used cars go to consumer marketplace
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    carsImported++;

    if (carsImported % 100 === 0) {
      console.log(`  Imported ${carsImported} cars...`);
    }
  } catch (error) {
    carsError++;
    if (carsError <= 5) {
      console.error(`Error importing car:`, error.message);
    }
  }
}

console.log(`\nCars imported: ${carsImported}`);
console.log(`Cars skipped (already exist): ${carsSkipped}`);
console.log(`Cars with errors: ${carsError}\n`);

console.log("=".repeat(60));
console.log("IMPORT COMPLETE");
console.log("=".repeat(60));
console.log(`Total dealers: ${dealersImported + dealersSkipped}`);
console.log(`Total cars: ${carsImported + carsSkipped}`);

process.exit(0);
