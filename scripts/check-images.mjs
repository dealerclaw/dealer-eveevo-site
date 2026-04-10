import { createConnection } from 'mysql2/promise';

const db = await createConnection(process.env.DATABASE_URL);

const [rows] = await db.execute(`
  SELECT id, make, model, year,
         JSON_LENGTH(images) as image_count,
         LEFT(images, 400) as images_preview,
         dealerClawCarId, dealerClawDealerId
  FROM cars 
  WHERE rebeccaReview IS NOT NULL AND rebeccaReview != 'null' AND rebeccaReview != ''
  LIMIT 10
`);

console.log('Cars with Rebecca reviews:');
for (const row of rows) {
  console.log(`\n--- ${row.year} ${row.make} ${row.model} (id=${row.id}, source=${row.source}) ---`);
  console.log(`  image_count: ${row.image_count}`);
  console.log(`  images_preview: ${row.images_preview}`);
}

await db.end();
