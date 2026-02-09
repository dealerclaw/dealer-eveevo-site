import { drizzle } from 'drizzle-orm/mysql2';
import { count } from 'drizzle-orm';
import { cars } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);
const result = await db.select({ count: count() }).from(cars);
console.log(`Current car count: ${result[0].count}`);
process.exit(0);
