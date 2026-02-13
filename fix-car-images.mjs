import { drizzle } from "drizzle-orm/mysql2";
import { cars } from "./drizzle/schema.ts";
import { eq, isNotNull } from "drizzle-orm";
import XLSX from 'xlsx';

const db = drizzle(process.env.DATABASE_URL);

console.log("Starting car images fix...\n");

// Read Excel file to get photo URLs
const workbook = XLSX.readFile('/home/ubuntu/upload/Firebase-export-merged-data-to-send.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Loaded ${data.length} rows from Excel\n`);

// Build map of advertId -> photoURLs
const imageMap = new Map();
for (const row of data) {
  if (row.advertId && row.photoURLs) {
    let photos = [];
    
    if (Array.isArray(row.photoURLs)) {
      photos = row.photoURLs;
    } else if (typeof row.photoURLs === 'string') {
      try {
        const parsed = JSON.parse(row.photoURLs);
        if (Array.isArray(parsed)) {
          photos = parsed;
        } else {
          photos = [row.photoURLs];
        }
      } catch {
        photos = [row.photoURLs];
      }
    }
    
    if (photos.length > 0) {
      imageMap.set(String(row.advertId), photos);
    }
  }
}

console.log(`Found ${imageMap.size} cars with photos\n`);

// Get all cars from database
const allCars = await db.select({ id: cars.id, firebaseId: cars.firebaseId })
  .from(cars)
  .where(isNotNull(cars.firebaseId));

console.log(`Found ${allCars.length} cars in database\n`);

// Update cars with images
let updated = 0;
let noImages = 0;

for (const car of allCars) {
  const photos = imageMap.get(car.firebaseId);
  
  if (photos && photos.length > 0) {
    await db.update(cars)
      .set({
        mainImage: photos[0],
        images: photos,
        updatedAt: new Date(),
      })
      .where(eq(cars.id, car.id));
    
    updated++;
    
    if (updated % 100 === 0) {
      console.log(`Updated ${updated} cars...`);
    }
  } else {
    noImages++;
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log("IMAGE FIX COMPLETE");
console.log("=".repeat(60));
console.log(`Cars updated with images: ${updated}`);
console.log(`Cars without images: ${noImages}`);

process.exit(0);
