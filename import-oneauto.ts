import XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { cars } from './drizzle/schema';
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
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  let matched = 0;
  let updated = 0;
  let unmatched = 0;
  const errors: string[] = [];
  
  console.log('Processing rows...');
  
  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, Math.min(i + batchSize, data.length));
    
    for (const row of batch) {
      try {
        // Try to find matching fields - using actual column names from OneAuto export
        const make = (row as any)['vehicle_data.manufacturer_desc'];
        const model = (row as any)['vehicle_data.model_range_desc'];
        const year = parseInt((row as any)['vehicle_data.first_registration_year'] || '0');
        const currentPrice = parseFloat((row as any)['advertised_price_gbp'] || '0');
        const daysOnMarket = parseInt((row as any)['days_on_market'] || '0');
        const priceChangeFromSheet = (row as any)['price_change_percentage'];
        
        // We don't have original price in this export
        const originalPrice = 0;
        
        if (!make || !model || !year || !currentPrice) {
          unmatched++;
          continue;
        }
        
        // Find car by make + model + year + price (with tolerance for price)
        // Allow 5% price difference to account for price changes
        const priceMin = currentPrice * 0.95;
        const priceMax = currentPrice * 1.05;
        
        const { sql: rawSql } = await import('drizzle-orm');
        
        const [car] = await db
          .select()
          .from(cars)
          .where(
            rawSql`${cars.make} = ${make} 
              AND ${cars.model} = ${model} 
              AND ${cars.year} = ${year} 
              AND ${cars.price} >= ${priceMin} 
              AND ${cars.price} <= ${priceMax}`
          )
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
        let healthRating: 'green' | 'amber' | 'blue' = 'green';
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
      } catch (error: any) {
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
