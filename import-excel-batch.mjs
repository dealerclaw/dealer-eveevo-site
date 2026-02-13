import { drizzle } from "drizzle-orm/mysql2";
import { dealers, cars } from "./drizzle/schema.ts";
import { eq, inArray } from "drizzle-orm";
import XLSX from 'xlsx';

const db = drizzle(process.env.DATABASE_URL);

console.log("Starting BATCH Excel data import...\n");

// Read Excel file
const workbook = XLSX.readFile('/home/ubuntu/upload/Firebase-export-merged-data-to-send.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Loaded ${data.length} rows from Excel\n`);

// Step 1: Extract and batch import dealers
console.log("=".repeat(60));
console.log("STEP 1: Batch Importing Dealers");
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
      subscriptionStatus: null,
    });
  }
}

console.log(`Found ${sellersMap.size} unique dealers`);

// Check which dealers already exist
const existingDealers = await db.select({ firebaseId: dealers.firebaseId, id: dealers.id })
  .from(dealers)
  .where(inArray(dealers.firebaseId, Array.from(sellersMap.keys()).map(String)));

const existingDealerIds = new Map(existingDealers.map(d => [d.firebaseId, d.id]));
console.log(`${existingDealerIds.size} dealers already exist`);

// Prepare new dealers for batch insert
const newDealers = [];
for (const [sellerId, dealerData] of sellersMap) {
  if (!existingDealerIds.has(String(sellerId))) {
    newDealers.push({
      userId: null,
      ...dealerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// Batch insert new dealers
if (newDealers.length > 0) {
  console.log(`Inserting ${newDealers.length} new dealers in batches...`);
  const BATCH_SIZE = 100;
  for (let i = 0; i < newDealers.length; i += BATCH_SIZE) {
    const batch = newDealers.slice(i, i + BATCH_SIZE);
    await db.insert(dealers).values(batch);
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, newDealers.length)}/${newDealers.length} dealers`);
  }
}

// Rebuild dealer ID map with all dealers
const allDealers = await db.select({ firebaseId: dealers.firebaseId, id: dealers.id })
  .from(dealers)
  .where(inArray(dealers.firebaseId, Array.from(sellersMap.keys()).map(String)));

const dealerIdMap = new Map(allDealers.map(d => [d.firebaseId, d.id]));
console.log(`Total dealers in map: ${dealerIdMap.size}\n`);

// Step 2: Batch import cars
console.log("=".repeat(60));
console.log("STEP 2: Batch Importing Cars");
console.log("=".repeat(60));

// Get existing car firebaseIds to skip duplicates
const existingCarIds = new Set();
const advertIds = data.map(row => row.advertId).filter(Boolean);
if (advertIds.length > 0) {
  const BATCH_SIZE = 1000;
  for (let i = 0; i < advertIds.length; i += BATCH_SIZE) {
    const batch = advertIds.slice(i, i + BATCH_SIZE).map(String);
    const existing = await db.select({ firebaseId: cars.firebaseId })
      .from(cars)
      .where(inArray(cars.firebaseId, batch));
    existing.forEach(car => existingCarIds.add(car.firebaseId));
  }
}
console.log(`${existingCarIds.size} cars already exist\n`);

// Prepare cars for batch insert
const newCars = [];
let skipped = 0;
let errors = 0;

for (const row of data) {
  try {
    const sellerId = String(row.sellerId);
    const dealerId = dealerIdMap.get(sellerId);

    if (!dealerId) {
      errors++;
      continue;
    }

    const advertId = row.advertId ? String(row.advertId) : null;
    if (advertId && existingCarIds.has(advertId)) {
      skipped++;
      continue;
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
    let condition = 'used';
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

    newCars.push({
      dealerId: dealerId,
      firebaseId: advertId,
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
      marketplace: 'consumer',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    errors++;
  }
}

console.log(`Prepared ${newCars.length} cars for import`);
console.log(`Skipped ${skipped} existing cars`);
console.log(`Errors: ${errors}\n`);

// Batch insert cars
if (newCars.length > 0) {
  console.log(`Inserting ${newCars.length} cars in batches...`);
  const BATCH_SIZE = 100;
  for (let i = 0; i < newCars.length; i += BATCH_SIZE) {
    const batch = newCars.slice(i, i + BATCH_SIZE);
    await db.insert(cars).values(batch);
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, newCars.length)}/${newCars.length} cars`);
  }
}

console.log("\n" + "=".repeat(60));
console.log("IMPORT COMPLETE");
console.log("=".repeat(60));
console.log(`Total dealers: ${dealerIdMap.size}`);
console.log(`Total cars imported: ${newCars.length}`);
console.log(`Total cars skipped: ${skipped}`);
console.log(`Total errors: ${errors}`);

process.exit(0);
