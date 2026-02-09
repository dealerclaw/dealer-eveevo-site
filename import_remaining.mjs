import { drizzle } from 'drizzle-orm/mysql2';
import { cars } from './drizzle/schema.ts';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

console.log('Loading Excel file...');
const workbook = XLSX.readFile('/home/ubuntu/upload/onautoaip-FULL-EXPORT-Ev-Petrol-Hybrid18-12-25(1).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Total rows in Excel: ${data.length}`);
console.log(`Skipping first 10,000 rows (already imported)`);

const db = drizzle(process.env.DATABASE_URL);

// Process remaining rows in batches
const startFrom = 10000;
const batchSize = 500;
let totalImported = 0;

for (let i = startFrom; i < data.length; i += batchSize) {
  const batch = data.slice(i, Math.min(i + batchSize, data.length));
  
  const values = batch.map(row => {
    // Parse images
    let images = [];
    if (row.image_links) {
      const imgStr = String(row.image_links);
      if (imgStr.startsWith('[') && imgStr.endsWith(']')) {
        try {
          images = JSON.parse(imgStr.replace(/'/g, '"'));
        } catch {
          images = imgStr.slice(1, -1).split(',').map(s => s.trim().replace(/'/g, ''));
        }
      } else {
        images = [imgStr];
      }
    }
    
    return {
      id: String(row.id || ''),
      make: row.make ? String(row.make).substring(0, 100) : '',
      model: row.model ? String(row.model).substring(0, 100) : '',
      year: row.year && !isNaN(row.year) ? parseInt(row.year) : null,
      price: row.price && !isNaN(row.price) ? parseFloat(row.price) : null,
      mileage: row.mileage && !isNaN(row.mileage) ? parseInt(row.mileage) : null,
      bodyType: row.bodyType ? String(row.bodyType).substring(0, 50) : null,
      fuelType: row.fuel ? String(row.fuel).substring(0, 50) : null,
      transmission: row.trans ? String(row.trans).substring(0, 50) : null,
      range: row.rangeReal && !isNaN(row.rangeReal) ? parseInt(row.rangeReal) : null,
      batteryCapacity: row.batteryCapacityUseable ? String(row.batteryCapacityUseable) : null,
      images: JSON.stringify(images),
    };
  });
  
  try {
    await db.insert(cars).values(values).onDuplicateKeyUpdate({
      set: {
        make: values[0].make,
        model: values[0].model,
        year: values[0].year,
        price: values[0].price,
        mileage: values[0].mileage,
        bodyType: values[0].bodyType,
        fuelType: values[0].fuelType,
        transmission: values[0].transmission,
        range: values[0].range,
        batteryCapacity: values[0].batteryCapacity,
        images: values[0].images,
      }
    });
    
    totalImported += values.length;
    const progress = ((i - startFrom + values.length) / (data.length - startFrom) * 100).toFixed(1);
    console.log(`Imported batch: ${totalImported}/${data.length - startFrom} cars (${progress}%)`);
  } catch (error) {
    console.error(`Error importing batch starting at ${i}:`, error.message);
  }
}

console.log(`\n✅ Successfully imported ${totalImported} additional cars!`);
console.log(`Total cars in database: ${9604 + totalImported}`);
process.exit(0);
