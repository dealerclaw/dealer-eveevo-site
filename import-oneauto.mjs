import XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { cars } from './drizzle/schema.js';
import { eq, or } from 'drizzle-orm';
import 'dotenv/config';

async function importOneAutoData() {
  console.log('Reading Excel file...');
  
  // Read with increased memory
  const workbook = XLSX.readFile('/home/ubuntu/upload/onautoaip-FULL-EXPORT-Ev-Petrol-Hybrid18-12-25(1).xlsx', {
    cellDates: true,
    cellNF: false,
    cellText: false
  });
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log('Converting to JSON...');
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Total rows: ${data.length}`);
  console.log('Sample columns:', Object.keys(data[0]).slice(0, 10).join(', '));
  
  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  let matched = 0;
  let updated = 0;
  let unmatched = 0;
  const errors = [];
  
  console.log('Processing rows...');
  
  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, Math.min(i + batchSize, data.length));
    
    for (const row of batch) {
      try {
        // Try to find matching fields
        const vin = row['VIN'] || row['vin'] || row['Vin'];
        const reg = row['Registration'] || row['Reg'] || row['reg'] || row['registration'];
        const daysOnMarket = parseInt(row['days_on_market'] || row['Days on Market'] || row['DaysOnMarket'] || '0');
        const priceChangeFromSheet = row['price_change_percentage'] || row['Price Change %'] || row['PriceChange'];
        const originalPrice = parseFloat(row['Original Price'] || row['OriginalPrice'] || row['original_price'] || '0');
        const currentPrice = parseFloat(row['Current Price'] || row['CurrentPrice'] || row['current_price'] || row['Price'] || row['price'] || '0');
        
        if (!vin && !reg) {
          unmatched++;
          continue;
        }
        
        // Find car by VIN or registration
        const conditions = [];
        if (vin) conditions.push(eq(cars.vin, vin));
        if (reg) conditions.push(eq(cars.registrationNumber, reg));
        
        const [car] = await db
          .select()
          .from(cars)
          .where(or(...conditions))
          .limit(1);
        
        if (!car) {
          unmatched++;
          continue;
        }
        
        matched++;
        
        // Use price change from sheet if available, otherwise calculate
        let priceChangePercentage = null;
        if (priceChangeFromSheet) {
          priceChangePercentage = parseFloat(priceChangeFromSheet).toFixed(2);
        } else if (originalPrice > 0 && currentPrice > 0) {
          priceChangePercentage = ((currentPrice - originalPrice) / originalPrice * 100).toFixed(2);
        }
        
        // Calculate health rating
        let healthRating = 'green';
        if (daysOnMarket >= 45 || (priceChangePercentage && parseFloat(priceChangePercentage) <= -10)) {
          healthRating = 'blue';
        } else if (daysOnMarket >= 31 || (priceChangePercentage && parseFloat(priceChangePercentage) <= -5)) {
          healthRating = 'amber';
        }
        
        // Update car
        await db
          .update(cars)
          .set({
            daysOnMarket: daysOnMarket,
            originalPrice: originalPrice > 0 ? originalPrice.toString() : car.originalPrice,
            priceChangePercentage: priceChangePercentage,
            inventoryHealthRating: healthRating,
            lastHealthCheck: new Date(),
          })
          .where(eq(cars.id, car.id));
        
        updated++;
      } catch (error) {
        errors.push(`Error processing row: ${error.message}`);
      }
    }
    
    console.log(`Processed ${Math.min(i + batchSize, data.length)} / ${data.length} rows...`);
  }
  
  await connection.end();
  
  console.log('\n=== Import Results ===');
  console.log(`Matched: ${matched}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unmatched: ${unmatched}`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.slice(0, 10).join(', ')}`);
  }
}

importOneAutoData().catch(console.error);
