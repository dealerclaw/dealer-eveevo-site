import { getDb } from './db';
import { auctionHistory, cars } from '../drizzle/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

/**
 * Get auction analytics for a dealer
 */
export async function getDealerAuctionAnalytics(dealerId: number, timeRange: '7d' | '30d' | '90d' | 'all') {
  const db = await getDb();
  if (!db) return null;

  // Calculate date threshold based on time range
  const now = new Date();
  let dateThreshold: Date | null = null;
  
  switch (timeRange) {
    case '7d':
      dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      dateThreshold = null;
      break;
  }

  // Get auction history for this dealer
  const whereConditions = dateThreshold
    ? and(
        eq(auctionHistory.sellerDealerId, dealerId),
        gte(auctionHistory.auctionEndDate, dateThreshold)
      )
    : eq(auctionHistory.sellerDealerId, dealerId);

  const auctions = await db
    .select()
    .from(auctionHistory)
    .where(whereConditions)
    .orderBy(desc(auctionHistory.auctionEndDate));

  // Calculate statistics
  const totalAuctions = auctions.length;
  const completedAuctions = auctions.filter(a => a.status === 'completed').length;
  const expiredNoBids = auctions.filter(a => a.status === 'expired_no_bids').length;
  const expiredBelowReserve = auctions.filter(a => a.status === 'expired_below_reserve').length;

  // Get active auctions (not in history yet)
  const activeAuctions = await db
    .select()
    .from(cars)
    .where(
      and(
        eq(cars.dealerId, dealerId),
        eq(cars.isAuction, true),
        gte(cars.auctionEndDate, now)
      )
    );

  // Calculate revenue and averages
  const totalRevenue = auctions
    .filter(a => a.status === 'completed' && a.finalPrice)
    .reduce((sum, a) => sum + parseFloat(a.finalPrice!), 0);

  const averageSalePrice = completedAuctions > 0 ? totalRevenue / completedAuctions : 0;

  const totalBids = auctions.reduce((sum, a) => sum + (a.totalBids || 0), 0);
  const averageBidsPerAuction = totalAuctions > 0 ? totalBids / totalAuctions : 0;

  const conversionRate = totalAuctions > 0 ? (completedAuctions / totalAuctions) * 100 : 0;

  const auctionsWithBids = auctions.filter(a => (a.totalBids || 0) > 0).length;
  const reserveMetRate = auctionsWithBids > 0 
    ? (completedAuctions / auctionsWithBids) * 100 
    : 0;

  // Get recent auctions with car details
  const recentAuctions = await Promise.all(
    auctions.slice(0, 10).map(async (auction) => {
      const car = await db
        .select()
        .from(cars)
        .where(eq(cars.id, auction.carId))
        .limit(1);

      return {
        id: auction.id,
        carId: auction.carId,
        make: car[0]?.make || 'Unknown',
        model: car[0]?.model || 'Unknown',
        year: car[0]?.year || '',
        auctionEndDate: auction.auctionEndDate,
        status: auction.status,
        totalBids: auction.totalBids,
        finalPrice: auction.finalPrice,
        reservePrice: auction.reservePrice,
      };
    })
  );

  return {
    stats: {
      totalAuctions,
      completedAuctions,
      activeAuctions: activeAuctions.length,
      expiredNoBids,
      expiredBelowReserve,
      totalRevenue,
      averageSalePrice,
      averageBidsPerAuction,
      conversionRate,
      reserveMetRate,
    },
    recentAuctions,
  };
}
