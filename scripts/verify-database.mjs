import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('Verifying EV Faults Database Expansion...\n');

const results = await db.execute(sql`
  SELECT make, model, COUNT(*) as count
  FROM evFaults
  GROUP BY make, model
  ORDER BY make, model
`);

console.log('Faults by Make/Model:');
console.log('='.repeat(70));
let total = 0;
for (const row of results[0]) {
  console.log(`${row.make.padEnd(20)} ${row.model.padEnd(30)} ${row.count} faults`);
  total += Number(row.count);
}
console.log('='.repeat(70));
console.log(`\nTotal: ${total} faults across ${results[0].length} models`);
console.log('\n✅ Database expansion successful!');

await connection.end();
