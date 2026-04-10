/**
 * Fixes Ruby hash format ({"key"=>"value"}) stored in images and mainImage fields
 * and converts them to valid JSON ({"key":"value"}).
 * Also extracts full_url strings from the object format into a plain string array.
 */
import { createConnection } from 'mysql2/promise';

const db = await createConnection(process.env.DATABASE_URL);

function rubyHashToJson(str) {
  if (!str) return null;
  // Convert Buffer to string if needed
  if (Buffer.isBuffer(str)) str = str.toString('utf8');
  if (typeof str !== 'string') str = String(str);
  // Replace Ruby hash rockets => with JSON colons :
  return str.replace(/=>/g, ':');
}

function normalizeImages(imagesStr) {
  if (!imagesStr) return JSON.stringify([]);
  // Convert Buffer to string if needed
  if (Buffer.isBuffer(imagesStr)) imagesStr = imagesStr.toString('utf8');
  if (typeof imagesStr !== 'string') imagesStr = String(imagesStr);
  
  // If it's already valid JSON with plain strings, leave it alone
  try {
    const parsed = JSON.parse(imagesStr);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return imagesStr;
      // If array of strings already, fine
      if (typeof parsed[0] === 'string') return imagesStr;
      // If array of objects with full_url, extract them
      if (typeof parsed[0] === 'object' && parsed[0].full_url) {
        return JSON.stringify(parsed.map(img => img.full_url));
      }
    }
    return imagesStr;
  } catch {
    // Ruby hash format - convert
    const fixed = rubyHashToJson(imagesStr);
    try {
      const parsed = JSON.parse(fixed);
      if (Array.isArray(parsed)) {
        if (typeof parsed[0] === 'string') return JSON.stringify(parsed);
        if (typeof parsed[0] === 'object' && parsed[0].full_url) {
          return JSON.stringify(parsed.map(img => img.full_url));
        }
      }
      return fixed;
    } catch (e2) {
      console.error('Could not fix images:', imagesStr.substring(0, 100), e2.message);
      return JSON.stringify([]);
    }
  }
}

function normalizeMainImage(mainImageStr) {
  if (!mainImageStr) return null;
  // Convert Buffer to string if needed
  if (Buffer.isBuffer(mainImageStr)) mainImageStr = mainImageStr.toString('utf8');
  if (typeof mainImageStr !== 'string') mainImageStr = String(mainImageStr);
  
  // If it's already a plain URL string
  if (mainImageStr.startsWith('http')) return mainImageStr;
  
  // Try to parse as Ruby hash or JSON object
  const fixed = rubyHashToJson(mainImageStr);
  try {
    const parsed = JSON.parse(fixed);
    if (typeof parsed === 'object' && parsed.full_url) {
      return parsed.full_url;
    }
    if (typeof parsed === 'string') return parsed;
    return null;
  } catch {
    // Try extracting URL directly with regex
    const match = mainImageStr.match(/https?:\/\/[^\s"',}]+/);
    return match ? match[0] : null;
  }
}

// Get all cars with Ruby hash format
const [rows] = await db.execute(
  "SELECT id, images, mainImage FROM cars WHERE images LIKE '%=>%' OR mainImage LIKE '%=>%'"
);

console.log(`Found ${rows.length} cars to fix...`);

let fixed = 0;
let errors = 0;

for (const row of rows) {
  try {
    const newImages = normalizeImages(row.images);
    const newMainImage = normalizeMainImage(row.mainImage);
    
    await db.execute(
      'UPDATE cars SET images = ?, mainImage = ? WHERE id = ?',
      [newImages, newMainImage, row.id]
    );
    fixed++;
    
    if (fixed % 20 === 0) {
      console.log(`  Fixed ${fixed}/${rows.length}...`);
    }
  } catch (err) {
    console.error(`Error fixing car ${row.id}:`, err.message);
    errors++;
  }
}

console.log(`\nDone! Fixed: ${fixed}, Errors: ${errors}`);

// Verify a sample
const [sample] = await db.execute(
  'SELECT id, make, model, mainImage, JSON_LENGTH(images) as img_count FROM cars WHERE id = 330117'
);
if (sample[0]) {
  console.log('\nSample car 330117:');
  console.log('  mainImage:', sample[0].mainImage?.substring(0, 80));
  console.log('  image_count:', sample[0].img_count);
}

await db.end();
