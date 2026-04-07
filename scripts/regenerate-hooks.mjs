import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
import https from 'https';

config();

async function invokeLLM(messages) {
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ messages, model: 'gpt-4o-mini' });
    const url = new URL(apiUrl + '/v1/chat/completions');
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  const [cars] = await conn.execute(
    "SELECT id, year, make, model, mileage, `condition`, price, rebeccaReview FROM cars WHERE rebeccaReview IS NOT NULL AND rebeccaReview NOT LIKE '%openingHook%' ORDER BY id LIMIT 33"
  );
  console.log('Cars to update:', cars.length);
  let updated = 0;

  for (const car of cars) {
    try {
      const review = JSON.parse(car.rebeccaReview);
      const verdict =
        review?.finalVerdict?.oneLineSummary ||
        review?.finalVerdict?.rebeccaVerdict ||
        '';
      const price = parseFloat(car.price || '0').toLocaleString('en-GB');
      const prompt = `Write a short, punchy opening hook (2-3 sentences) for a car review in this EXACT format:

The [MODEL] is [SHORT DESCRIPTION]. It's got [FEATURE 1], [FEATURE 2], and [FEATURE 3]. But let's be honest, you're really here because [FUNNY REMARK]!

Car: ${car.year} ${car.make} ${car.model}
Mileage: ${car.mileage || 'unknown'} miles
Price: £${price}
Verdict: ${verdict}

Return ONLY the opening hook text, no quotes around it, no extra commentary.`;

      const response = await invokeLLM([
        {
          role: 'system',
          content:
            'You are Rebecca, a witty British car reviewer. Be funny, direct, and concise.',
        },
        { role: 'user', content: prompt },
      ]);

      const hookText = response.choices?.[0]?.message?.content?.trim();
      if (hookText) {
        review.openingHook = hookText;
        await conn.execute(
          'UPDATE cars SET rebeccaReview = ? WHERE id = ?',
          [JSON.stringify(review), car.id]
        );
        updated++;
        process.stdout.write('.');
      } else {
        process.stdout.write('?');
      }
    } catch (e) {
      console.error(`\nFailed for car ${car.id}:`, e.message);
      process.stdout.write('X');
    }
  }

  console.log(`\nDone. Updated ${updated} / ${cars.length} cars.`);
  await conn.end();
}

main().catch(console.error);
