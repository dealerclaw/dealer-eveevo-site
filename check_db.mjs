import { drizzle } from 'drizzle-orm/mysql2';
import { cars } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

try {
  const allCars = await db.select().from(cars).limit(5);
  console.log('Cars in database:', allCars.length);
  console.log('Sample cars:', JSON.stringify(allCars, null, 2));
} catch (error) {
  console.error('Error querying database:', error);
}

process.exit(0);
