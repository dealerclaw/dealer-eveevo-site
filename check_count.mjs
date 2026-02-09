import { drizzle } from 'drizzle-orm/mysql2';
import { cars } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);
const result = await db.select({ count: sql`count(*)` }).from(cars);
console.log(`Total cars in database: ${result[0].count}`);
process.exit(0);
