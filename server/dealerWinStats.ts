import { getDb } from './db';
import { dealerBids } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get auction win statistics for a dealer
 */
export async function getDealerWinStats(dealerId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all bids for this dealer
  const allBids = await db
    .select()
    .from(dealerBids)
    .where(eq(dealerBids.dealerId, dealerId));

  // Calculate statistics
  const totalBids = allBids.length;
  const wonBids = allBids.filter(b => b.status === 'won');
  const totalWins = wonBids.length;
  
  const totalSpent = wonBids.reduce((sum, bid) => {
    return sum + parseFloat(bid.bidAmount);
  }, 0);

  const winRate = totalBids > 0 ? (totalWins / totalBids) * 100 : 0;

  return {
    totalWins,
    totalBids,
    winRate,
    totalSpent,
  };
}
