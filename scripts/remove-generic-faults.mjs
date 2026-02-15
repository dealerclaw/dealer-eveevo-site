import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { evFaults } from '../drizzle/schema.js';
import { eq, and, inArray, sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('Removing generic faults from database...\n');

// Models with unique researched faults that we want to keep
const modelsWithUniqueFaults = [
  'Model 3',
  'Model Y',
  'Leaf',
  'EV6',
  'IONIQ 5',
  'ID.3',
  'ID.4',
  'i3',
  'i4',
  'MG4',
  '2', // Polestar 2
];

try {
  // First, count total faults
  const totalResult = await db.select({ count: sql`COUNT(*)` }).from(evFaults);
  const totalFaults = totalResult[0].count;
  console.log(`Total faults before cleanup: ${totalFaults}`);
  
  // Count faults for models with unique research
  const uniqueResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(evFaults)
    .where(inArray(evFaults.model, modelsWithUniqueFaults));
  const uniqueFaults = uniqueResult[0].count;
  console.log(`Unique researched faults to keep: ${uniqueFaults}`);
  console.log(`Generic faults to remove: ${totalFaults - uniqueFaults}\n`);
  
   // Delete all faults NOT in the unique models list
  const result = await db
    .delete(evFaults)
    .where(sql`model NOT IN (${modelsWithUniqueFaults.map(m => `'${m}'`).join(', ')})`);
  
  console.log(`✅ Removed generic faults successfully!`);
  
  // Verify final count
  const finalResult = await db.select({ count: sql`COUNT(*)` }).from(evFaults);
  const finalCount = finalResult[0].count;
  console.log(`\nFinal fault count: ${finalCount}`);
  
  // Show breakdown by model
  const breakdown = await db
    .select({
      make: evFaults.make,
      model: evFaults.model,
      count: sql`COUNT(*)`,
    })
    .from(evFaults)
    .groupBy(evFaults.make, evFaults.model)
    .orderBy(sql`COUNT(*) DESC`);
  
  console.log('\nFaults by model:');
  breakdown.forEach(row => {
    console.log(`  ${row.make} ${row.model}: ${row.count} faults`);
  });
  
} catch (error) {
  console.error('Error removing generic faults:', error);
  process.exit(1);
} finally {
  await connection.end();
}
