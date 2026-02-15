import { getDb } from './db';
import { proxyBids, dealerBids, cars, dealers } from '../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { InsertProxyBid } from '../drizzle/schema';

/**
 * Set up a proxy bid for automatic bidding
 */
export async function setProxyBid(data: InsertProxyBid) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if dealer already has an active proxy bid for this car
  const existing = await db
    .select()
    .from(proxyBids)
    .where(
      and(
        eq(proxyBids.carId, data.carId),
        eq(proxyBids.dealerId, data.dealerId),
        eq(proxyBids.isActive, true)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing proxy bid
    await db
      .update(proxyBids)
      .set({
        maxBidAmount: data.maxBidAmount,
        incrementAmount: data.incrementAmount,
        updatedAt: new Date(),
      })
      .where(eq(proxyBids.id, existing[0].id));
    
    return existing[0].id;
  } else {
    // Create new proxy bid
    const result = await db.insert(proxyBids).values(data);
    return result[0].insertId;
  }
}

/**
 * Cancel a proxy bid
 */
export async function cancelProxyBid(proxyBidId: number, dealerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(proxyBids)
    .set({ isActive: false })
    .where(
      and(
        eq(proxyBids.id, proxyBidId),
        eq(proxyBids.dealerId, dealerId)
      )
    );
}

/**
 * Get active proxy bid for a dealer on a specific car
 */
export async function getProxyBid(carId: number, dealerId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(proxyBids)
    .where(
      and(
        eq(proxyBids.carId, carId),
        eq(proxyBids.dealerId, dealerId),
        eq(proxyBids.isActive, true)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Process proxy bids after a new bid is placed
 * This function checks all active proxy bids and automatically places counter-bids if needed
 */
export async function processProxyBids(carId: number, newBidAmount: number, excludeDealerId?: number) {
  const db = await getDb();
  if (!db) return;

  // Get all active proxy bids for this car (excluding the dealer who just bid)
  const activeProxyBids = await db
    .select()
    .from(proxyBids)
    .where(
      and(
        eq(proxyBids.carId, carId),
        eq(proxyBids.isActive, true)
      )
    );

  // Filter out the dealer who just placed the bid
  const eligibleProxyBids = excludeDealerId
    ? activeProxyBids.filter(pb => pb.dealerId !== excludeDealerId)
    : activeProxyBids;

  // Sort by max bid amount (highest first) to determine who should win
  eligibleProxyBids.sort((a, b) => parseFloat(b.maxBidAmount) - parseFloat(a.maxBidAmount));

  if (eligibleProxyBids.length === 0) {
    return; // No proxy bids to process
  }

  const topProxyBid = eligibleProxyBids[0];
  const maxBid = parseFloat(topProxyBid.maxBidAmount);
  const increment = parseFloat(topProxyBid.incrementAmount || '100');

  // Check if the top proxy bid can outbid the current bid
  if (maxBid > newBidAmount) {
    // Calculate the new bid amount (current bid + increment, but not exceeding max)
    const newProxyBidAmount = Math.min(newBidAmount + increment, maxBid);

    // Place the automatic bid
    const { placeBid } = await import('./db');
    await placeBid({
      carId,
      dealerId: topProxyBid.dealerId,
      userId: topProxyBid.userId,
      bidAmount: newProxyBidAmount.toString(),
      message: '🤖 Automatic proxy bid',
      status: 'winning',
    });

    // Update the proxy bid's current bid amount
    await db
      .update(proxyBids)
      .set({
        currentBidAmount: newProxyBidAmount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(proxyBids.id, topProxyBid.id));

    console.log(`[ProxyBid] Placed automatic bid of £${newProxyBidAmount} for dealer ${topProxyBid.dealerId} on car ${carId}`);

    // Recursively process proxy bids again in case there are competing proxy bids
    await processProxyBids(carId, newProxyBidAmount, topProxyBid.dealerId);
  } else {
    // Proxy bid max is reached or exceeded, deactivate it
    await db
      .update(proxyBids)
      .set({ isActive: false })
      .where(eq(proxyBids.id, topProxyBid.id));
    
    console.log(`[ProxyBid] Proxy bid ${topProxyBid.id} reached max limit of £${maxBid}`);
  }
}

/**
 * Get all proxy bids for a dealer
 */
export async function getDealerProxyBids(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      proxyBid: proxyBids,
      car: cars,
    })
    .from(proxyBids)
    .leftJoin(cars, eq(proxyBids.carId, cars.id))
    .where(
      and(
        eq(proxyBids.dealerId, dealerId),
        eq(proxyBids.isActive, true)
      )
    );

  return result.map(r => ({
    ...r.proxyBid,
    car: r.car,
  }));
}
