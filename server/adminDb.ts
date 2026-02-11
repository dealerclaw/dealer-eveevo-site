import { getDb } from "./db";
import { dealers, cars, users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Get all dealers with their user information and car counts
 */
export async function getAllDealers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: dealers.id,
      userId: dealers.userId,
      name: dealers.name,
      email: dealers.email,
      phone: dealers.phone,
      whatsappNumber: dealers.whatsappNumber,
      address: dealers.address,
      city: dealers.city,
      postcode: dealers.postcode,
      website: dealers.website,
      profileUrl: dealers.profileUrl,
      isVerified: dealers.isVerified,
      subscriptionStatus: dealers.subscriptionStatus,
      subscriptionExpiresAt: dealers.subscriptionExpiresAt,
      createdAt: dealers.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(dealers)
    .leftJoin(users, eq(dealers.userId, users.id))
    .orderBy(dealers.createdAt);

  // Get car counts for each dealer
  const dealersWithCounts = await Promise.all(
    result.map(async (dealer) => {
      const carCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(cars)
        .where(eq(cars.dealerId, dealer.id));
      
      const carCount = Number(carCountResult[0]?.count || 0);
      
      return {
        ...dealer,
        carCount,
      };
    })
  );

  return dealersWithCounts;
}

/**
 * Get all cars for a specific dealer
 */
export async function getDealerCarsAdmin(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(cars)
    .where(eq(cars.dealerId, dealerId))
    .orderBy(cars.createdAt);
}

/**
 * Get dealer by ID with full details
 */
export async function getDealerById(dealerId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: dealers.id,
      userId: dealers.userId,
      name: dealers.name,
      description: dealers.description,
      email: dealers.email,
      phone: dealers.phone,
      whatsappNumber: dealers.whatsappNumber,
      address: dealers.address,
      city: dealers.city,
      postcode: dealers.postcode,
      website: dealers.website,
      logoUrl: dealers.logoUrl,
      profileUrl: dealers.profileUrl,
      rating: dealers.rating,
      isVerified: dealers.isVerified,
      subscriptionStatus: dealers.subscriptionStatus,
      subscriptionExpiresAt: dealers.subscriptionExpiresAt,
      stripeCustomerId: dealers.stripeCustomerId,
      stripeSubscriptionId: dealers.stripeSubscriptionId,
      createdAt: dealers.createdAt,
      updatedAt: dealers.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(dealers)
    .leftJoin(users, eq(dealers.userId, users.id))
    .where(eq(dealers.id, dealerId))
    .limit(1);

  return result[0] || null;
}
