import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const PID = process.env.SERVER_PID;
const environ = readFileSync(`/proc/${PID}/environ`, 'utf8');
const dbUrl = environ.split('\0').find(e => e.startsWith('DATABASE_URL=')).split('=').slice(1).join('=');

const conn = await createConnection(dbUrl);

// Show all bids for user 1050228
console.log('=== Bids for user 1050228 ===');
const [bids] = await conn.execute(
  'SELECT id, carId, dealerId, userId, status, paymentStatus, paidAt, message, bidAmount FROM dealerBids WHERE userId = 1050228 ORDER BY id DESC LIMIT 10'
);
bids.forEach(b => console.log(JSON.stringify(b)));

// Also check car 152244
console.log('\n=== Car 152244 ===');
const [cars] = await conn.execute(
  'SELECT id, make, model, year, isAvailable, isAuction FROM cars WHERE id = 152244'
);
cars.forEach(c => console.log(JSON.stringify(c)));

await conn.end();
