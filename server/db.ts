import { eq, and, gte, lte, gt, lt, like, inArray, desc, sql, ne, or, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  cars, 
  dealers, 
  reservations, 
  favorites, 
  savedSearches,
  financeApplications,
  carViews,
  carInquiries,
  dealerApplications,
  testDriveBookings,
  dealerBids,
  dealerReviews,
  dealerCart,
  dealerWatchlist,
  auctionHistory,
  dealerOffers,
  type Car,
  type Dealer,
  type Reservation,
  type Favorite,
  type SavedSearch,
  type FinanceApplication,
  type CarView,
  type CarInquiry,
  type DealerApplication,
  type InsertDealerApplication,
  type TestDriveBooking,
  type InsertTestDriveBooking,
  type DealerBid,
  type InsertDealerBid,
  type DealerReview,
  type InsertDealerReview
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.accountType !== undefined) {
      values.accountType = user.accountType;
      updateSet.accountType = user.accountType;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Car queries
export async function getCars(filters?: {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minRange?: number;
  maxRange?: number;
  minMileage?: number;
  maxMileage?: number;
  condition?: 'new' | 'used';
  dealerId?: number;
  isFeatured?: boolean;
  marketplace?: 'consumer' | 'dealer_only';
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(cars).where(eq(cars.isAvailable, true));
  
  const conditions = [eq(cars.isAvailable, true)];
  
  if (filters?.make) {
    conditions.push(eq(cars.make, filters.make));
  }
  if (filters?.model) {
    conditions.push(like(cars.model, `%${filters.model}%`));
  }
  if (filters?.minPrice !== undefined) {
    conditions.push(gte(cars.price, filters.minPrice.toString()));
  }
  if (filters?.maxPrice !== undefined) {
    conditions.push(lte(cars.price, filters.maxPrice.toString()));
  }
  if (filters?.minRange !== undefined) {
    conditions.push(gte(cars.realRange, filters.minRange));
  }
  if (filters?.maxRange !== undefined) {
    conditions.push(lte(cars.realRange, filters.maxRange));
  }
  if (filters?.minMileage !== undefined) {
    conditions.push(gte(cars.mileage, filters.minMileage));
  }
  if (filters?.maxMileage !== undefined) {
    conditions.push(lte(cars.mileage, filters.maxMileage));
  }
  if (filters?.condition) {
    conditions.push(eq(cars.condition, filters.condition));
  }
  if (filters?.dealerId) {
    conditions.push(eq(cars.dealerId, filters.dealerId));
  }
  if (filters?.isFeatured !== undefined) {
    conditions.push(eq(cars.isFeatured, filters.isFeatured));
  }
  if (filters?.marketplace) {
    conditions.push(eq(cars.marketplace, filters.marketplace));
  } else {
    // Default to consumer marketplace if not specified
    conditions.push(eq(cars.marketplace, 'consumer'));
  }

  const result = await db
    .select({
      // Car fields
      id: cars.id,
      firebaseId: cars.firebaseId,
      dealerId: cars.dealerId,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      price: cars.price,
      mileage: cars.mileage,
      condition: cars.condition,
      bodyType: cars.bodyType,
      color: cars.color,
      fuelType: cars.fuelType,
      transmission: cars.transmission,
      batteryCapacity: cars.batteryCapacity,
      range: cars.range,
      realRange: cars.realRange,
      chargingTime: cars.chargingTime,
      acceleration: cars.acceleration,
      topSpeed: cars.topSpeed,
      power: cars.power,
      images: cars.images,
      mainImage: cars.mainImage,
      description: cars.description,
      features: cars.features,
      vin: cars.vin,
      registrationNumber: cars.registrationNumber,
      isAvailable: cars.isAvailable,
      isFeatured: cars.isFeatured,
      marketplace: cars.marketplace,
      isAuction: cars.isAuction,
      auctionStartDate: cars.auctionStartDate,
      auctionEndDate: cars.auctionEndDate,
      startingBid: cars.startingBid,
      reservePrice: cars.reservePrice,
      currentHighestBid: cars.currentHighestBid,
      buyNowPrice: cars.buyNowPrice,
      createdAt: cars.createdAt,
      updatedAt: cars.updatedAt,
      // Dealer fields
      dealerName: dealers.name,
      dealerEmail: dealers.email,
      dealerPhone: dealers.phone,
      dealerAddress: dealers.address,
    })
    .from(cars)
    .leftJoin(dealers, eq(cars.dealerId, dealers.id))
    .where(and(...conditions))
    .orderBy(desc(cars.createdAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);

  return result;
}

export async function getCarById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      car: cars,
      dealer: dealers,
    })
    .from(cars)
    .leftJoin(dealers, eq(cars.dealerId, dealers.id))
    .where(eq(cars.id, id))
    .limit(1);
  
  if (result.length === 0) return null;
  
  return {
    ...result[0].car,
    dealer: result[0].dealer,
  };
}

export async function getCarsByIds(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];

  return await db.select().from(cars).where(inArray(cars.id, ids));
}

// Dealer queries
export async function getDealers(filters?: {
  city?: string;
  isVerified?: boolean;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters?.city) {
    conditions.push(eq(dealers.city, filters.city));
  }
  if (filters?.isVerified !== undefined) {
    conditions.push(eq(dealers.isVerified, filters.isVerified));
  }

  const query = conditions.length > 0
    ? db.select().from(dealers).where(and(...conditions))
    : db.select().from(dealers);

  return await query.limit(filters?.limit ?? 50);
}

export async function getDealerById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(dealers).where(eq(dealers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Reservation queries
export async function getUserReservations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: reservations.id,
      userId: reservations.userId,
      carId: reservations.carId,
      dealerId: reservations.dealerId,
      status: reservations.status,
      reservationDate: reservations.reservationDate,
      viewingDate: reservations.viewingDate,
      userName: reservations.userName,
      userEmail: reservations.userEmail,
      userPhone: reservations.userPhone,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
      updatedAt: reservations.updatedAt,
      car: cars,
    })
    .from(reservations)
    .leftJoin(cars, eq(reservations.carId, cars.id))
    .where(eq(reservations.userId, userId))
    .orderBy(desc(reservations.createdAt));
}

export async function createReservation(data: {
  userId: number;
  carId: number;
  dealerId?: number;
  reservationDate: Date;
  viewingDate?: Date;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reservations).values(data);
  return result;
}

export async function updateReservationStatus(id: number, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reservations).set({ status }).where(eq(reservations.id, id));
}

// Favorites queries
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      favorite: favorites,
      car: cars,
    })
    .from(favorites)
    .leftJoin(cars, eq(favorites.carId, cars.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  return result;
}

export async function addFavorite(userId: number, carId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(favorites).values({ userId, carId });
}

export async function removeFavorite(userId: number, carId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.carId, carId))
  );
}

// Saved searches queries
export async function getUserSavedSearches(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
}

export async function saveSearch(userId: number, name: string, searchParams: Record<string, any>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(savedSearches).values({ userId, name, searchParams });
}

export async function deleteSavedSearch(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(savedSearches).where(
    and(eq(savedSearches.id, id), eq(savedSearches.userId, userId))
  );
}

// Finance application queries
export async function createFinanceApplication(data: {
  userId: number;
  carId?: number;
  loanAmount?: number;
  depositAmount?: number;
  term?: number;
  preApprovedAmount?: number;
  creditScore?: number;
  applicantData?: Record<string, any>;
  externalApplicationId?: string;
  responseData?: Record<string, any>;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertData: any = { ...data };
  if (data.loanAmount !== undefined) {
    insertData.loanAmount = data.loanAmount.toString();
  }
  if (data.depositAmount !== undefined) {
    insertData.depositAmount = data.depositAmount.toString();
  }
  if (data.preApprovedAmount !== undefined) {
    insertData.preApprovedAmount = data.preApprovedAmount.toString();
  }

  const result = await db.insert(financeApplications).values(insertData);
  return result;
}

export async function getUserFinanceApplications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(financeApplications)
    .where(eq(financeApplications.userId, userId))
    .orderBy(desc(financeApplications.createdAt));
}

export async function updateFinanceApplication(
  id: number,
  data: {
    status?: 'draft' | 'submitted' | 'approved' | 'rejected';
    externalApplicationId?: string;
    responseData?: Record<string, any>;
    monthlyPayment?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { ...data };
  if (data.monthlyPayment !== undefined) {
    updateData.monthlyPayment = data.monthlyPayment.toString();
  }

  await db.update(financeApplications).set(updateData).where(eq(financeApplications.id, id));
}

// Dealer management queries
export async function getDealerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(dealers)
    .where(eq(dealers.userId, userId))
    .limit(1);

  return result[0] || null;
}

export async function getDealerStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get dealer record
  const dealer = await getDealerByUserId(userId);
  if (!dealer) return null;

  // Get total listings
  const totalListingsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(cars)
    .where(eq(cars.dealerId, dealer.id));
  const totalListings = Number(totalListingsResult[0]?.count || 0);

  // Get available listings
  const availableListingsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(cars)
    .where(and(eq(cars.dealerId, dealer.id), eq(cars.isAvailable, true)));
  const availableListings = Number(availableListingsResult[0]?.count || 0);

  // Get total views
  const totalViewsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(carViews)
    .innerJoin(cars, eq(carViews.carId, cars.id))
    .where(eq(cars.dealerId, dealer.id));
  const totalViews = Number(totalViewsResult[0]?.count || 0);

  // Get total inquiries
  const totalInquiriesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(carInquiries)
    .where(eq(carInquiries.dealerId, dealer.id));
  const totalInquiries = Number(totalInquiriesResult[0]?.count || 0);

  // Get new inquiries
  const newInquiriesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(carInquiries)
    .where(and(eq(carInquiries.dealerId, dealer.id), eq(carInquiries.status, 'new')));
  const newInquiries = Number(newInquiriesResult[0]?.count || 0);

  // Get recent inquiries
  const recentInquiries = await db
    .select()
    .from(carInquiries)
    .where(eq(carInquiries.dealerId, dealer.id))
    .orderBy(desc(carInquiries.createdAt))
    .limit(5);

  // Get top performing listings
  const topListings = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      views: sql<number>`count(${carViews.id})`,
    })
    .from(cars)
    .leftJoin(carViews, eq(cars.id, carViews.carId))
    .where(eq(cars.dealerId, dealer.id))
    .groupBy(cars.id)
    .orderBy(desc(sql<number>`count(${carViews.id})`))
    .limit(5);

  // Get auction purchases (won bids)
  const auctionPurchases = await db
    .select({
      id: dealerBids.id,
      carId: dealerBids.carId,
      bidAmount: dealerBids.bidAmount,
      status: dealerBids.status,
      createdAt: dealerBids.createdAt,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      mainImage: cars.mainImage,
    })
    .from(dealerBids)
    .innerJoin(cars, eq(dealerBids.carId, cars.id))
    .where(and(
      eq(dealerBids.dealerId, dealer.id),
      eq(dealerBids.status, 'won')
    ))
    .orderBy(desc(dealerBids.createdAt))
    .limit(10);

  return {
    totalListings,
    availableListings,
    totalViews,
    totalInquiries,
    newInquiries,
    recentInquiries,
    topListings,
    auctionPurchases,
  };
}

export async function getDealerCars(userId: number, options?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  const dealer = await getDealerByUserId(userId);
  if (!dealer) return [];

  const query = db.select().from(cars).where(eq(cars.dealerId, dealer.id));

  if (options?.limit && options?.offset) {
    return await query.limit(options.limit).offset(options.offset);
  } else if (options?.limit) {
    return await query.limit(options.limit);
  } else if (options?.offset) {
    return await query.offset(options.offset);
  }

  return await query;
}

export async function addDealerCar(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dealer = await getDealerByUserId(userId);
  if (!dealer) throw new Error("Dealer not found");

  const insertData: any = {
    ...data,
    dealerId: dealer.id,
  };

  // Convert decimal fields to strings
  if (data.price !== undefined) {
    insertData.price = data.price.toString();
  }
  if (data.batteryCapacity !== undefined) {
    insertData.batteryCapacity = data.batteryCapacity.toString();
  }

  const result = await db.insert(cars).values(insertData);
  return result;
}

export async function updateDealerCar(userId: number, carId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dealer = await getDealerByUserId(userId);
  if (!dealer) throw new Error("Dealer not found");

  // Verify car belongs to dealer
  const car = await db
    .select()
    .from(cars)
    .where(and(eq(cars.id, carId), eq(cars.dealerId, dealer.id)))
    .limit(1);

  if (!car || car.length === 0) {
    throw new Error("Car not found or does not belong to dealer");
  }

  const updateData: any = { ...data };

  // Convert decimal fields to strings
  if (data.price !== undefined) {
    updateData.price = data.price.toString();
  }
  if (data.batteryCapacity !== undefined) {
    updateData.batteryCapacity = data.batteryCapacity.toString();
  }

  await db.update(cars).set(updateData).where(eq(cars.id, carId));
  return { success: true };
}

export async function deleteDealerCar(userId: number, carId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dealer = await getDealerByUserId(userId);
  if (!dealer) throw new Error("Dealer not found");

  // Verify car belongs to dealer
  const car = await db
    .select()
    .from(cars)
    .where(and(eq(cars.id, carId), eq(cars.dealerId, dealer.id)))
    .limit(1);

  if (!car || car.length === 0) {
    throw new Error("Car not found or does not belong to dealer");
  }

  await db.delete(cars).where(eq(cars.id, carId));
  return { success: true };
}

export async function getDealerInquiries(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const dealer = await getDealerByUserId(userId);
  if (!dealer) return [];

  return await db
    .select()
    .from(carInquiries)
    .where(eq(carInquiries.dealerId, dealer.id))
    .orderBy(desc(carInquiries.createdAt));
}

/**
 * Create dealer application
 */
export async function createDealerApplication(
  userId: number,
  data: Omit<InsertDealerApplication, 'userId' | 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<DealerApplication> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dealerApplications).values({
    userId,
    ...data,
  });

  const applicationId = Number(result[0].insertId);
  const applications = await db
    .select()
    .from(dealerApplications)
    .where(eq(dealerApplications.id, applicationId))
    .limit(1);

  if (!applications || applications.length === 0) {
    throw new Error("Failed to create dealer application");
  }

  return applications[0];
}

/**
 * Get dealer applications (for admin)
 */
export async function getDealerApplications(filters?: {
  status?: 'pending' | 'approved' | 'rejected';
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(dealerApplications);

  if (filters?.status) {
    query = query.where(eq(dealerApplications.status, filters.status)) as any;
  }

  query = query.orderBy(desc(dealerApplications.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

/**
 * Get dealer by Stripe customer ID
 */
export async function getDealerByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(dealers)
    .where(eq(dealers.stripeCustomerId, stripeCustomerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Update dealer subscription information
 */
export async function updateDealerSubscription(
  dealerId: number,
  data: {
    subscriptionStatus?: 'none' | 'active' | 'expired';
    subscriptionExpiresAt?: Date | null;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dealers).set(data).where(eq(dealers.id, dealerId));
  return { success: true };
}

/**
 * Get dealer analytics
 */
export async function getDealerAnalytics(dealerId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get total vehicles
  const vehiclesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(cars)
    .where(eq(cars.dealerId, dealerId));
  const totalVehicles = vehiclesResult[0]?.count || 0;

  // Get total views
  const viewsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(carViews)
    .innerJoin(cars, eq(carViews.carId, cars.id))
    .where(eq(cars.dealerId, dealerId));
  const totalViews = viewsResult[0]?.count || 0;

  // Get total inquiries
  const inquiriesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(carInquiries)
    .where(eq(carInquiries.dealerId, dealerId));
  const totalInquiries = inquiriesResult[0]?.count || 0;

  // Get WhatsApp contacts (approximate from inquiries with type)
  const whatsappResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(carInquiries)
    .where(and(
      eq(carInquiries.dealerId, dealerId),
      eq(carInquiries.inquiryType, 'general')
    ));
  const whatsappContacts = whatsappResult[0]?.count || 0;

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentViewsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(carViews)
    .innerJoin(cars, eq(carViews.carId, cars.id))
    .where(and(
      eq(cars.dealerId, dealerId),
      gte(carViews.createdAt, thirtyDaysAgo)
    ));
  const recentViews = recentViewsResult[0]?.count || 0;

  const recentInquiriesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(carInquiries)
    .where(and(
      eq(carInquiries.dealerId, dealerId),
      gte(carInquiries.createdAt, thirtyDaysAgo)
    ));
  const recentInquiries = recentInquiriesResult[0]?.count || 0;

  // Get top viewed vehicles
  const topVehicles = await db
    .select({
      carId: cars.id,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      views: sql<number>`count(${carViews.id})`,
    })
    .from(cars)
    .leftJoin(carViews, eq(carViews.carId, cars.id))
    .where(eq(cars.dealerId, dealerId))
    .groupBy(cars.id, cars.make, cars.model, cars.year)
    .orderBy(desc(sql`count(${carViews.id})`))
    .limit(5);

  return {
    totalVehicles,
    totalViews,
    totalInquiries,
    whatsappContacts,
    recentViews,
    recentInquiries,
    conversionRate: totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(2) : '0.00',
    topVehicles,
  };
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: number,
  status: 'pending' | 'approved' | 'rejected'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(dealerApplications)
    .set({ status, updatedAt: new Date() })
    .where(eq(dealerApplications.id, applicationId));

  return { success: true };
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: number,
  role: 'user' | 'dealer' | 'admin'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId));

  return { success: true };
}

/**
 * Create dealer from application
 */
export async function createDealer(
  userId: number,
  data: {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    verified: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user's firebaseId (openId)
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  const result = await db.insert(dealers).values({
    userId,
    firebaseId: user[0].openId, // Link dealer to user account
    name: data.businessName,
    email: data.email,
    phone: data.phone,
    whatsappNumber: data.phone,
    address: data.address,
    description: data.description,
    isVerified: data.verified,
  });

  return { success: true, dealerId: Number(result[0].insertId) };
}

// Test Drive Booking queries
export async function checkTestDriveAvailability(dealerId: number, preferredDate: Date, preferredTime: string) {
  const db = await getDb();
  if (!db) return true; // If DB not available, allow booking

  // Check for existing bookings at the same dealer, date, and time
  const existing = await db
    .select()
    .from(testDriveBookings)
    .where(
      and(
        eq(testDriveBookings.dealerId, dealerId),
        eq(testDriveBookings.preferredDate, preferredDate),
        eq(testDriveBookings.preferredTime, preferredTime),
        // Only count bookings that aren't cancelled
        ne(testDriveBookings.status, 'cancelled')
      )
    )
    .limit(1);

  return existing.length === 0; // Available if no existing bookings
}

export async function getBookedTimeSlots(dealerId: number, date: Date) {
  const db = await getDb();
  if (!db) return [];

  // Get all bookings for this dealer on this date (excluding cancelled)
  const bookings = await db
    .select({ preferredTime: testDriveBookings.preferredTime })
    .from(testDriveBookings)
    .where(
      and(
        eq(testDriveBookings.dealerId, dealerId),
        eq(testDriveBookings.preferredDate, date),
        ne(testDriveBookings.status, 'cancelled')
      )
    );

  // Return array of booked time strings
  return bookings.map(b => b.preferredTime);
}

export async function createTestDriveBooking(data: InsertTestDriveBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(testDriveBookings).values(data);
  return result;
}

export async function getDealerTestDriveBookings(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: testDriveBookings.id,
      userId: testDriveBookings.userId,
      carId: testDriveBookings.carId,
      dealerId: testDriveBookings.dealerId,
      preferredDate: testDriveBookings.preferredDate,
      preferredTime: testDriveBookings.preferredTime,
      status: testDriveBookings.status,
      customerName: testDriveBookings.customerName,
      customerEmail: testDriveBookings.customerEmail,
      customerPhone: testDriveBookings.customerPhone,
      notes: testDriveBookings.notes,
      createdAt: testDriveBookings.createdAt,
      updatedAt: testDriveBookings.updatedAt,
      car: cars,
    })
    .from(testDriveBookings)
    .leftJoin(cars, eq(testDriveBookings.carId, cars.id))
    .where(eq(testDriveBookings.dealerId, dealerId))
    .orderBy(desc(testDriveBookings.preferredDate));
}

export async function updateTestDriveBookingStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(testDriveBookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(testDriveBookings.id, id));
}


// ============================================================================
// Dealer Auction Functions
// ============================================================================

/**
 * Get all active auction vehicles in the dealer marketplace
 */
export async function getActiveAuctionVehicles() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  
  // Get cars that are currently in auction (dealer-to-dealer marketplace)
  const results = await db
    .select({
      id: cars.id,
      dealerId: cars.dealerId,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      price: cars.price,
      mileage: cars.mileage,
      condition: cars.condition,
      mainImage: cars.mainImage,
      batteryCapacity: cars.batteryCapacity,
      realRange: cars.realRange,
      marketplace: cars.marketplace,
      isAvailable: cars.isAvailable,
      isAuction: cars.isAuction,
      auctionStartDate: cars.auctionStartDate,
      auctionEndDate: cars.auctionEndDate,
      startingBid: cars.startingBid,
      reservePrice: cars.reservePrice,
      currentHighestBid: cars.currentHighestBid,
      buyNowPrice: cars.buyNowPrice,
      description: cars.description,
      chargingTime: cars.chargingTime,
      conditionNotes: cars.conditionNotes,
      inspectionReports: cars.inspectionReports,
      dealerName: dealers.name,
      dealerCity: dealers.city,
      dealerVerified: dealers.isVerified,
    })
    .from(cars)
    .leftJoin(dealers, eq(cars.dealerId, dealers.id))
    .where(
      and(
        eq(cars.isAuction, true),
        eq(cars.isAvailable, true),
        gt(cars.auctionEndDate, now),
        isNotNull(cars.dealerId) // Exclude demo cars without dealer
      )
    )
    .orderBy(desc(cars.auctionStartDate))
    .limit(50); // Show up to 50 active auctions

  return results;
}

/**
 * Place a bid on an auction vehicle
 */
export async function placeBid(data: InsertDealerBid) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert the new bid
  await db.insert(dealerBids).values(data);

  // Update the current highest bid on the car
  await db
    .update(cars)
    .set({ currentHighestBid: data.bidAmount })
    .where(eq(cars.id, data.carId));

  // Mark all previous bids as outbid
  await db
    .update(dealerBids)
    .set({ status: 'outbid' })
    .where(
      and(
        eq(dealerBids.carId, data.carId),
        ne(dealerBids.dealerId, data.dealerId)
      )
    );
}

/**
 * Get bid history for a specific vehicle
 */
export async function getVehicleBidHistory(carId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: dealerBids.id,
      bidAmount: dealerBids.bidAmount,
      dealerName: dealers.name,
      createdAt: dealerBids.createdAt,
      status: dealerBids.status,
    })
    .from(dealerBids)
    .leftJoin(dealers, eq(dealerBids.dealerId, dealers.id))
    .where(eq(dealerBids.carId, carId))
    .orderBy(desc(dealerBids.bidAmount));
}

/**
 * Get dealer's bids
 */
export async function getDealerBids(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      bid: dealerBids,
      car: cars,
    })
    .from(dealerBids)
    .leftJoin(cars, eq(dealerBids.carId, cars.id))
    .where(eq(dealerBids.dealerId, dealerId))
    .orderBy(desc(dealerBids.createdAt));
}

/**
 * Start an auction on a vehicle
 */
export async function startAuction(carId: number, startingBid: number, reservePrice: number, durationDays: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await db
    .update(cars)
    .set({
      isAuction: true,
      auctionStartDate: now,
      auctionEndDate: endDate,
      startingBid: startingBid.toString(),
      reservePrice: reservePrice.toString(),
      currentHighestBid: startingBid.toString(),
      marketplace: 'dealer_only',
    })
    .where(eq(cars.id, carId));
}


/**
 * Buy Now - Instant purchase of auction vehicle
 */
export async function buyNowAuction(carId: number, dealerId: number, userId: number, purchasePrice: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // End the auction immediately
  const now = new Date();
  await db
    .update(cars)
    .set({
      isAuction: false,
      auctionEndDate: now,
      isAvailable: false, // Mark as sold
    })
    .where(eq(cars.id, carId));

  // Create a winning bid record
  await db.insert(dealerBids).values({
    carId,
    dealerId,
    userId,
    bidAmount: purchasePrice.toString(),
    message: "Buy Now - Instant Purchase",
    status: 'won',
  });

  // Mark all other bids as lost
  await db
    .update(dealerBids)
    .set({ status: 'lost' })
    .where(
      and(
        eq(dealerBids.carId, carId),
        ne(dealerBids.dealerId, dealerId)
      )
    );
}

/**
 * Get subscription analytics for a dealer
 */
export async function getSubscriptionAnalytics(dealerId: number) {
  const db = await getDb();
  if (!db) return null;

  const dealer = await db.select().from(dealers).where(eq(dealers.id, dealerId)).limit(1);
  if (!dealer.length) return null;

  const createdAt = dealer[0].createdAt;
  const now = new Date();
  const subscriptionDays = createdAt 
    ? Math.floor((now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Count bids placed by this dealer
  const bids = await db.select().from(dealerBids).where(eq(dealerBids.dealerId, dealerId));
  const bidsPlaced = bids.length;

  // Count auctions won (where dealer's bid is the highest and auction ended)
  const wonBids = await db
    .select({
      carId: dealerBids.carId,
      bidAmount: dealerBids.bidAmount,
    })
    .from(dealerBids)
    .where(eq(dealerBids.dealerId, dealerId));

  let auctionsWon = 0;
  let totalSpent = 0;
  let estimatedRetailValue = 0;

  for (const bid of wonBids) {
    const car = await db.select().from(cars).where(eq(cars.id, bid.carId)).limit(1);
    if (car.length && car[0].auctionEndDate && new Date(car[0].auctionEndDate) < now) {
      // Check if this bid is the highest
      const allBids = await db
        .select()
        .from(dealerBids)
        .where(eq(dealerBids.carId, bid.carId))
        .orderBy(desc(dealerBids.bidAmount));
      
      if (allBids.length && allBids[0].dealerId === dealerId) {
        auctionsWon++;
        const bidAmountNum = typeof bid.bidAmount === 'string' ? parseFloat(bid.bidAmount) : bid.bidAmount;
        totalSpent += bidAmountNum;
        const carPrice = typeof car[0].price === 'string' ? parseFloat(car[0].price) : car[0].price;
        estimatedRetailValue += carPrice || bidAmountNum * 1.2; // Assume 20% markup if no retail price
      }
    }
  }

  const savingsAmount = estimatedRetailValue - totalSpent;
  const savingsPercentage = estimatedRetailValue > 0 
    ? ((savingsAmount / estimatedRetailValue) * 100)
    : 0;

  // Count vehicles viewed (for now, return 0 - would need view tracking)
  const vehiclesViewed = 0;

  return {
    vehiclesViewed,
    bidsPlaced,
    auctionsWon,
    totalSpent,
    estimatedRetailValue,
    savingsAmount,
    savingsPercentage,
    subscriptionDays,
  };
}

/**
 * Generate unique referral code for dealer
 */
export async function generateReferralCode(dealerId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate code: first 3 letters of dealer name + random 5 chars
  const dealer = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, dealerId))
    .limit(1);

  if (!dealer || dealer.length === 0) {
    throw new Error("Dealer not found");
  }

  const prefix = dealer[0].name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const code = `${prefix}${randomPart}`;

  // Update dealer with referral code
  await db.update(dealers).set({ referralCode: code }).where(eq(dealers.id, dealerId));

  return code;
}

/**
 * Get dealer by referral code
 */
export async function getDealerByReferralCode(referralCode: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(dealers)
    .where(eq(dealers.referralCode, referralCode))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Track referral when new dealer subscribes
 */
export async function trackReferral(referredDealerId: number, referrerDealerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update referred dealer's referredBy field
  await db
    .update(dealers)
    .set({ referredBy: referrerDealerId })
    .where(eq(dealers.id, referredDealerId));

  // Add £20 credit to referrer
  const referrer = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, referrerDealerId))
    .limit(1);

  if (referrer && referrer.length > 0) {
    const currentCredits = parseFloat(referrer[0].referralCredits || '0');
    const newCredits = currentCredits + 20;

    await db
      .update(dealers)
      .set({ referralCredits: newCredits.toString() })
      .where(eq(dealers.id, referrerDealerId));
  }

  return { success: true };
}

/**
 * Get referral stats for dealer
 */
export async function getDealerReferralStats(dealerId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get dealer's referral code and credits
  const dealer = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, dealerId))
    .limit(1);

  if (!dealer || dealer.length === 0) {
    return null;
  }

  // Count successful referrals (dealers they referred who have active subscriptions)
  const referralsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(dealers)
    .where(and(
      eq(dealers.referredBy, dealerId),
      eq(dealers.subscriptionStatus, 'active')
    ));

  const successfulReferrals = referralsResult[0]?.count || 0;

  // Get list of referred dealers
  const referredDealers = await db
    .select({
      id: dealers.id,
      name: dealers.name,
      subscriptionStatus: dealers.subscriptionStatus,
      createdAt: dealers.createdAt,
    })
    .from(dealers)
    .where(eq(dealers.referredBy, dealerId))
    .orderBy(desc(dealers.createdAt));

  return {
    referralCode: dealer[0].referralCode,
    referralCredits: parseFloat(dealer[0].referralCredits || '0'),
    successfulReferrals,
    referredDealers,
  };
}

/**
 * Purchase management functions
 */
export async function getPurchaseDetails(userId: number, purchaseId: number) {
  const db = await getDb();
  if (!db) return null;

  const dealer = await getDealerByUserId(userId);
  if (!dealer) return null;

  // Get the purchase (bid) with car and seller details
  const purchase = await db
    .select({
      id: dealerBids.id,
      carId: dealerBids.carId,
      bidAmount: dealerBids.bidAmount,
      status: dealerBids.status,
      createdAt: dealerBids.createdAt,
      // Vehicle details
      vehicleMake: cars.make,
      vehicleModel: cars.model,
      vehicleYear: cars.year,
      vehicleCondition: cars.condition,
      vehicleMileage: cars.mileage,
      vehicleRealRange: cars.realRange,
      vehicleBatteryCapacity: cars.batteryCapacity,
      vehicleTransmission: cars.transmission,
      vehicleColor: cars.color,
      vehicleVin: cars.vin,
      vehicleMainImage: cars.mainImage,
      // Seller details
      sellerId: dealers.id,
      sellerName: dealers.name,
      sellerEmail: dealers.email,
      sellerPhone: dealers.phone,
      sellerAddress: dealers.address,
    })
    .from(dealerBids)
    .innerJoin(cars, eq(dealerBids.carId, cars.id))
    .innerJoin(dealers, eq(cars.dealerId, dealers.id))
    .where(and(
      eq(dealerBids.id, purchaseId),
      eq(dealerBids.dealerId, dealer.id)
    ))
    .limit(1);

  if (purchase.length === 0) return null;

  const p = purchase[0];
  
  return {
    id: p.id,
    purchaseDate: p.createdAt,
    purchasePrice: p.bidAmount,
    purchaseMethod: 'auction',
    status: p.status,
    vehicle: {
      id: p.carId,
      make: p.vehicleMake,
      model: p.vehicleModel,
      year: p.vehicleYear,
      condition: p.vehicleCondition,
      mileage: p.vehicleMileage,
      realRange: p.vehicleRealRange,
      batteryCapacity: p.vehicleBatteryCapacity,
      transmission: p.vehicleTransmission,
      color: p.vehicleColor,
      vin: p.vehicleVin,
      mainImage: p.vehicleMainImage,
    },
    seller: {
      id: p.sellerId,
      name: p.sellerName,
      email: p.sellerEmail,
      phone: p.sellerPhone,
      address: p.sellerAddress,
    },
  };
}

export async function generatePurchaseReceipt(userId: number, purchaseId: number) {
  const purchase = await getPurchaseDetails(userId, purchaseId);
  if (!purchase) throw new Error('Purchase not found');

  // Generate simple text receipt (could be enhanced with PDF library)
  const receipt = `
EVEEVO PURCHASE RECEIPT
========================

Order #: ${purchase.id}
Date: ${new Date(purchase.purchaseDate).toLocaleDateString()}

VEHICLE DETAILS
---------------
${purchase.vehicle.make} ${purchase.vehicle.model} ${purchase.vehicle.year}
Condition: ${purchase.vehicle.condition}
Mileage: ${purchase.vehicle.mileage?.toLocaleString()} miles
VIN: ${purchase.vehicle.vin || 'N/A'}

PURCHASE DETAILS
----------------
Purchase Price: £${parseFloat(purchase.purchasePrice.toString()).toLocaleString()}
Payment Method: ${purchase.purchaseMethod}
Status: ${purchase.status}

SELLER INFORMATION
------------------
${purchase.seller.name}
${purchase.seller.email || ''}
${purchase.seller.phone || ''}
${purchase.seller.address || ''}

========================
Thank you for your purchase!
  `.trim();

  return receipt;
}

export async function exportPurchaseHistoryCSV(dealerId: number) {
  const db = await getDb();
  if (!db) return '';

  const purchases = await db
    .select({
      id: dealerBids.id,
      date: dealerBids.createdAt,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      price: dealerBids.bidAmount,
      status: dealerBids.status,
      seller: dealers.name,
    })
    .from(dealerBids)
    .innerJoin(cars, eq(dealerBids.carId, cars.id))
    .innerJoin(dealers, eq(cars.dealerId, dealers.id))
    .where(and(
      eq(dealerBids.dealerId, dealerId),
      eq(dealerBids.status, 'won')
    ))
    .orderBy(desc(dealerBids.createdAt));

  // Generate CSV
  const headers = ['Order ID', 'Date', 'Make', 'Model', 'Year', 'Price', 'Status', 'Seller'];
  const rows = purchases.map(p => [
    p.id,
    new Date(p.date).toLocaleDateString(),
    p.make,
    p.model,
    p.year,
    `£${parseFloat(p.price.toString()).toLocaleString()}`,
    p.status,
    p.seller,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csv;
}

export async function exportPurchaseHistoryPDF(dealerId: number) {
  const db = await getDb();
  if (!db) return '';

  const purchases = await db
    .select({
      id: dealerBids.id,
      date: dealerBids.createdAt,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      price: dealerBids.bidAmount,
      status: dealerBids.status,
      seller: dealers.name,
    })
    .from(dealerBids)
    .innerJoin(cars, eq(dealerBids.carId, cars.id))
    .innerJoin(dealers, eq(cars.dealerId, dealers.id))
    .where(and(
      eq(dealerBids.dealerId, dealerId),
      eq(dealerBids.status, 'won')
    ))
    .orderBy(desc(dealerBids.createdAt));

  // Generate simple text-based PDF content (could be enhanced with PDF library)
  const content = `
EVEEVO PURCHASE HISTORY
========================

${purchases.map(p => `
Order #${p.id}
Date: ${new Date(p.date).toLocaleDateString()}
Vehicle: ${p.make} ${p.model} ${p.year}
Price: £${parseFloat(p.price.toString()).toLocaleString()}
Seller: ${p.seller}
Status: ${p.status}
------------------------
`).join('\n')}

Total Purchases: ${purchases.length}
  `.trim();

  return content;
}

/**
 * Dealer Reviews functions
 */
export async function submitDealerReview(data: InsertDealerReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already reviewed this dealer
  const existing = await db
    .select()
    .from(dealerReviews)
    .where(and(
      eq(dealerReviews.dealerId, data.dealerId),
      eq(dealerReviews.userId, data.userId)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("You have already reviewed this dealer");
  }

  // Insert review
  await db.insert(dealerReviews).values(data);

  // Update dealer's average rating and review count
  await updateDealerRating(data.dealerId);
}

export async function getDealerReviews(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  const reviews = await db
    .select({
      id: dealerReviews.id,
      rating: dealerReviews.rating,
      reviewText: dealerReviews.reviewText,
      isVerified: dealerReviews.isVerified,
      createdAt: dealerReviews.createdAt,
      userName: users.name,
    })
    .from(dealerReviews)
    .innerJoin(users, eq(dealerReviews.userId, users.id))
    .where(and(
      eq(dealerReviews.dealerId, dealerId),
      eq(dealerReviews.isVisible, true)
    ))
    .orderBy(desc(dealerReviews.createdAt));

  return reviews;
}

export async function updateDealerRating(dealerId: number) {
  const db = await getDb();
  if (!db) return;

  // Calculate average rating
  const result = await db
    .select({
      avgRating: sql<number>`AVG(${dealerReviews.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(dealerReviews)
    .where(and(
      eq(dealerReviews.dealerId, dealerId),
      eq(dealerReviews.isVisible, true)
    ));

  const avgRating = result[0]?.avgRating || 0;
  const reviewCount = result[0]?.count || 0;

  // Update dealer record
  await db
    .update(dealers)
    .set({
      rating: Number(avgRating).toFixed(2),
      reviewCount: Number(reviewCount),
    })
    .where(eq(dealers.id, dealerId));
}

export async function getAllDealersForFilter() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: dealers.id,
      name: dealers.name,
      vehicleCount: sql<number>`COUNT(${cars.id})`,
    })
    .from(dealers)
    .leftJoin(cars, and(
      eq(dealers.id, cars.dealerId),
      eq(cars.isAvailable, true),
      eq(cars.marketplace, 'consumer')
    ))
    .groupBy(dealers.id, dealers.name)
    .having(sql`COUNT(${cars.id}) > 0`)
    .orderBy(dealers.name);

  return result;
}


/**
 * Dealer Cart Functions
 */
export async function addToCart(dealerId: number, carId: number, priceAtAdd: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already in cart
  const existing = await db
    .select()
    .from(dealerCart)
    .where(and(
      eq(dealerCart.dealerId, dealerId),
      eq(dealerCart.carId, carId)
    ));

  if (existing.length > 0) {
    throw new Error("Vehicle already in cart");
  }

  await db.insert(dealerCart).values({
    dealerId,
    carId,
    priceAtAdd,
  });
}

export async function removeFromCart(dealerId: number, carId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(dealerCart)
    .where(and(
      eq(dealerCart.dealerId, dealerId),
      eq(dealerCart.carId, carId)
    ));
}

export async function getCartItems(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: dealerCart.id,
      carId: dealerCart.carId,
      priceAtAdd: dealerCart.priceAtAdd,
      createdAt: dealerCart.createdAt,
      // Car details
      make: cars.make,
      model: cars.model,
      year: cars.year,
      price: cars.price,
      mainImage: cars.mainImage,
      condition: cars.condition,
      mileage: cars.mileage,
      isAvailable: cars.isAvailable,
    })
    .from(dealerCart)
    .leftJoin(cars, eq(dealerCart.carId, cars.id))
    .where(eq(dealerCart.dealerId, dealerId));
}

export async function clearCart(dealerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(dealerCart)
    .where(eq(dealerCart.dealerId, dealerId));
}

export async function calculateBulkDiscount(itemCount: number, totalPrice: number): Promise<{ discountPercent: number; discountedPrice: number; savings: number }> {
  let discountPercent = 0.85; // Base 15% discount

  if (itemCount >= 5) {
    discountPercent = 0.90; // 10% discount for 5+ cars
  } else if (itemCount >= 2) {
    discountPercent = 0.87; // 13% discount for 2-4 cars
  }

  const discountedPrice = totalPrice * discountPercent;
  const savings = totalPrice - discountedPrice;

  return {
    discountPercent: (1 - discountPercent) * 100,
    discountedPrice,
    savings,
  };
}

/**
 * Dealer Watchlist Functions
 */
export async function addToWatchlist(dealerId: number, carId: number, initialPrice: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already in watchlist
  const existing = await db
    .select()
    .from(dealerWatchlist)
    .where(and(
      eq(dealerWatchlist.dealerId, dealerId),
      eq(dealerWatchlist.carId, carId)
    ));

  if (existing.length > 0) {
    throw new Error("Vehicle already in watchlist");
  }

  await db.insert(dealerWatchlist).values({
    dealerId,
    carId,
    initialPrice,
    alertOnPriceDrop: true,
    alertThreshold: "5.00", // 5% price drop threshold
  });
}

export async function removeFromWatchlist(dealerId: number, carId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(dealerWatchlist)
    .where(and(
      eq(dealerWatchlist.dealerId, dealerId),
      eq(dealerWatchlist.carId, carId)
    ));
}

export async function getWatchlistItems(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: dealerWatchlist.id,
      carId: dealerWatchlist.carId,
      initialPrice: dealerWatchlist.initialPrice,
      lastNotifiedPrice: dealerWatchlist.lastNotifiedPrice,
      alertOnPriceDrop: dealerWatchlist.alertOnPriceDrop,
      alertThreshold: dealerWatchlist.alertThreshold,
      createdAt: dealerWatchlist.createdAt,
      // Car details
      make: cars.make,
      model: cars.model,
      year: cars.year,
      price: cars.price,
      mainImage: cars.mainImage,
      condition: cars.condition,
      mileage: cars.mileage,
      isAvailable: cars.isAvailable,
    })
    .from(dealerWatchlist)
    .leftJoin(cars, eq(dealerWatchlist.carId, cars.id))
    .where(eq(dealerWatchlist.dealerId, dealerId));
}

export async function checkPriceDrops(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  const watchlistItems = await getWatchlistItems(dealerId);
  const priceDrops = [];

  for (const item of watchlistItems) {
    if (!item.price || !item.initialPrice) continue;

    const currentPrice = parseFloat(item.price);
    const initialPrice = parseFloat(item.initialPrice);
    const priceDrop = ((initialPrice - currentPrice) / initialPrice) * 100;

    const threshold = item.alertThreshold ? parseFloat(item.alertThreshold) : 5;

    if (priceDrop >= threshold) {
      priceDrops.push({
        ...item,
        priceDrop: priceDrop.toFixed(2),
        savings: (initialPrice - currentPrice).toFixed(2),
      });

      // Update last notified price
      await db
        .update(dealerWatchlist)
        .set({ lastNotifiedPrice: item.price })
        .where(eq(dealerWatchlist.id, item.id));
    }
  }

  return priceDrops;
}

// ============================================================================
// Auction Management
// ============================================================================

export async function getDealerAuctions(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  // Get active auctions with bid counts and highest bid
  const auctions = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      price: cars.price,
      reservePrice: cars.reservePrice,
      auctionStartDate: cars.auctionStartDate,
      auctionEndDate: cars.auctionEndDate,
      mainImage: cars.mainImage,
    })
    .from(cars)
    .where(
      and(
        eq(cars.dealerId, dealerId),
        eq(cars.isAuction, true),
        gt(cars.auctionEndDate, now)
      )
    );

  // Get bid counts and highest bids for each auction
  const auctionsWithBids = await Promise.all(
    auctions.map(async (auction) => {
      const bids = await db
        .select({
          bidAmount: dealerBids.bidAmount,
        })
        .from(dealerBids)
        .where(eq(dealerBids.carId, auction.id))
        .orderBy(desc(dealerBids.bidAmount));

      return {
        ...auction,
        bidCount: bids.length,
        currentHighestBid: bids.length > 0 ? bids[0].bidAmount : null,
      };
    })
  );

  return auctionsWithBids;
}

export async function getDealerAuctionStats(dealerId: number) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();

  // Count active auctions
  const activeAuctions = await db
    .select({ count: sql<number>`count(*)` })
    .from(cars)
    .where(
      and(
        eq(cars.dealerId, dealerId),
        eq(cars.isAuction, true),
        gt(cars.auctionEndDate, now)
      )
    );

  // Count total bids received on dealer's auctions
  const totalBids = await db
    .select({ count: sql<number>`count(*)` })
    .from(dealerBids)
    .leftJoin(cars, eq(dealerBids.carId, cars.id))
    .where(eq(cars.dealerId, dealerId));

  // Get average winning bid from completed auctions
  const completedAuctions = await db
    .select({
      finalPrice: auctionHistory.finalPrice,
    })
    .from(auctionHistory)
    .where(
      and(
        eq(auctionHistory.sellerDealerId, dealerId),
        eq(auctionHistory.status, 'completed')
      )
    );

  const avgWinningBid =
    completedAuctions.length > 0
      ? completedAuctions.reduce((sum, a) => sum + parseFloat(a.finalPrice || '0'), 0) /
        completedAuctions.length
      : 0;

  return {
    activeAuctions: activeAuctions[0]?.count || 0,
    totalBids: totalBids[0]?.count || 0,
    avgWinningBid: avgWinningBid > 0 ? avgWinningBid.toFixed(2) : null,
  };
}

export async function getAuctionBidHistory(carId: number) {
  const db = await getDb();
  if (!db) return [];

  const bids = await db
    .select({
      id: dealerBids.id,
      bidAmount: dealerBids.bidAmount,
      message: dealerBids.message,
      status: dealerBids.status,
      createdAt: dealerBids.createdAt,
      dealerName: dealers.name,
    })
    .from(dealerBids)
    .leftJoin(dealers, eq(dealerBids.dealerId, dealers.id))
    .where(eq(dealerBids.carId, carId))
    .orderBy(desc(dealerBids.createdAt));

  return bids;
}

export async function recordAuctionOutcome(carId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Import notification function
  const { notifyOwner } = await import('./_core/notification');

  // Get car and auction details
  const car = await db
    .select()
    .from(cars)
    .where(eq(cars.id, carId))
    .limit(1);

  if (!car || car.length === 0 || !car[0].isAuction) {
    return null;
  }

  const carData = car[0];

  // Get all bids for this auction
  const bids = await db
    .select()
    .from(dealerBids)
    .where(eq(dealerBids.carId, carId))
    .orderBy(desc(dealerBids.bidAmount));

  const totalBids = bids.length;
  const winningBid = bids.length > 0 ? bids[0] : null;
  const reservePrice = parseFloat(carData.reservePrice || '0');
  const highestBidAmount = winningBid ? parseFloat(winningBid.bidAmount) : 0;

  // Determine auction status
  let status: 'completed' | 'expired_no_bids' | 'expired_below_reserve' | 'cancelled' = 'expired_no_bids';
  let winnerDealerId = null;
  let finalPrice = null;

  if (totalBids === 0) {
    status = 'expired_no_bids';
  } else if (highestBidAmount < reservePrice) {
    status = 'expired_below_reserve';
  } else {
    status = 'completed';
    winnerDealerId = winningBid!.dealerId;
    finalPrice = winningBid!.bidAmount;

    // Update winning bid status
    await db
      .update(dealerBids)
      .set({ status: 'won' })
      .where(eq(dealerBids.id, winningBid!.id));
    
    // Send winner notification
    try {
      // Get winner dealer and user details
      const winnerDealer = await db
        .select()
        .from(dealers)
        .where(eq(dealers.id, winnerDealerId!))
        .limit(1);
      
      const winnerUser = winningBid?.userId ? await db
        .select()
        .from(users)
        .where(eq(users.id, winningBid.userId))
        .limit(1) : null;
      
      // Get seller dealer details
      const sellerDealer = carData.dealerId ? await db
        .select()
        .from(dealers)
        .where(eq(dealers.id, carData.dealerId))
        .limit(1) : null;
      
      if (winnerDealer && winnerDealer.length > 0) {
        const dealer = winnerDealer[0];
        const user = winnerUser && winnerUser.length > 0 ? winnerUser[0] : null;
        const seller = sellerDealer && sellerDealer.length > 0 ? sellerDealer[0] : null;
        
        // Prepare notification content
        const vehicleInfo = `${carData.make} ${carData.model} ${carData.year}`;
        const notificationTitle = `🏆 Auction Won: ${vehicleInfo}`;
        const notificationContent = `
Congratulations! You have won the auction for:

**Vehicle:** ${vehicleInfo}
**VIN:** ${carData.vin || 'N/A'}
**Winning Bid:** £${parseFloat(finalPrice!).toLocaleString()}
**Auction Ended:** ${new Date(carData.auctionEndDate!).toLocaleString()}

**Next Steps:**
1. Payment must be completed within 48 hours
2. Contact the seller to arrange delivery or pickup
3. Review vehicle inspection report if available

        **Dealer:** ${dealer.name}
        **Contact:** ${dealer.email || dealer.phone || 'Contact via platform'}

Thank you for participating in EVEEVO auctions!
        `;
        
        // Send in-app notification to project owner
        await notifyOwner({
          title: notificationTitle,
          content: notificationContent,
        });
        
        // Send email notification if dealer has email
        if (dealer.email) {
          const { sendEmail, generateAuctionWinnerEmail } = await import('./email');
          const emailHtml = generateAuctionWinnerEmail({
            dealerName: dealer.name,
            vehicleInfo,
            vin: carData.vin || 'N/A',
            winningBid: parseFloat(finalPrice!),
            auctionEndDate: new Date(carData.auctionEndDate!),
            sellerName: seller?.name || 'EVEEVO Seller',
            sellerContact: seller?.email || seller?.phone || 'Contact via platform',
          });
          
          const emailSent = await sendEmail({
            to: dealer.email,
            subject: `🏆 You Won: ${vehicleInfo} - £${parseFloat(finalPrice!).toLocaleString()}`,
            html: emailHtml,
          });
          
          if (emailSent) {
            console.log(`[Auction] Email notification sent to ${dealer.email}`);
          }
        }
        
        console.log(`[Auction] Winner notifications sent for car ${carId} to dealer ${dealer.name}`);
      }
    } catch (error) {
      console.error(`[Auction] Failed to send winner notification for car ${carId}:`, error);
      // Don't throw - notification failure shouldn't break auction processing
    }

    // Update losing bids
    if (bids.length > 1) {
      const losingBidIds = bids.slice(1).map(b => b.id);
      for (const bidId of losingBidIds) {
        await db
          .update(dealerBids)
          .set({ status: 'lost' })
          .where(eq(dealerBids.id, bidId));
      }
    }
  }

  // Record auction history
  await db.insert(auctionHistory).values({
    carId,
    sellerDealerId: carData.dealerId!,
    auctionStartDate: carData.auctionStartDate!,
    auctionEndDate: carData.auctionEndDate!,
    reservePrice: carData.reservePrice!,
    status,
    winningBidId: winningBid?.id || null,
    winnerDealerId,
    finalPrice,
    totalBids,
  });

  // Update car to remove auction status
  await db
    .update(cars)
    .set({
      isAuction: false,
      auctionStartDate: null,
      auctionEndDate: null,
    })
    .where(eq(cars.id, carId));

  return { status, totalBids, finalPrice };
}

export async function processExpiredAuctions() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  // Find all expired auctions
  const expiredAuctions = await db
    .select({ id: cars.id })
    .from(cars)
    .where(
      and(
        eq(cars.isAuction, true),
        lt(cars.auctionEndDate, now)
      )
    );

  const results = [];
  for (const auction of expiredAuctions) {
    const result = await recordAuctionOutcome(auction.id);
    if (result) {
      results.push({ carId: auction.id, ...result });
    }
  }

  return results;
}


export async function getSimilarCars(carId: number, limit: number = 4) {
  const db = await getDb();
  if (!db) return [];
  
  // Get the target car first
  const targetCar = await db.select().from(cars).where(eq(cars.id, carId)).limit(1);
  
  if (!targetCar || targetCar.length === 0) {
    return [];
  }
  
  const car = targetCar[0];
  
  // Find similar cars based on make, model, and price range
  const priceMin = car.price ? parseFloat(car.price.toString()) * 0.8 : 0;
  const priceMax = car.price ? parseFloat(car.price.toString()) * 1.2 : 999999;
  
  const similarCars = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      price: cars.price,
      mileage: cars.mileage,
      realRange: cars.realRange,
      batteryCapacity: cars.batteryCapacity,
      condition: cars.condition,
      mainImage: cars.mainImage,
      isAvailable: cars.isAvailable,
    })
    .from(cars)
    .where(
      and(
        ne(cars.id, carId), // Exclude the current car
        eq(cars.isAvailable, true),
        or(
          eq(cars.make, car.make), // Same make
          and( // Or similar price range
            gte(cars.price, priceMin.toString()),
            lte(cars.price, priceMax.toString())
          )
        )
      )
    )
    .limit(limit);
  
  return similarCars;
}

/**
 * Update bid payment status
 */
export async function updateBidPaymentStatus(
  bidId: number,
  updates: {
    paymentStatus?: 'pending' | 'paid' | 'failed';
    stripePaymentIntentId?: string;
    paidAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(dealerBids)
    .set(updates)
    .where(eq(dealerBids.id, bidId));

  return true;
}

/**
 * Update bid inspection schedule
 */
export async function updateBidInspectionSchedule(
  bidId: number,
  updates: {
    inspectionScheduledAt?: Date;
    inspectionNotes?: string | null;
  }
) {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(dealerBids)
    .set(updates)
    .where(eq(dealerBids.id, bidId));

  return true;
}

/**
 * Create a dealer offer
 */
export async function createDealerOffer(data: {
  carId: number;
  fromDealerId: number;
  toDealerId: number;
  offerAmount: number;
  message?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(dealerOffers).values({
    carId: data.carId,
    fromDealerId: data.fromDealerId,
    toDealerId: data.toDealerId,
    offerAmount: data.offerAmount.toString(),
    message: data.message,
    status: 'pending',
  });
  return { success: true };
}

/**
 * Get dealer offers (both made and received)
 */
export async function getDealerOffers(dealerId: number) {
  const db = await getDb();
  if (!db) return { made: [], received: [] };

  // Offers made by this dealer
  const madeOffers = await db
    .select()
    .from(dealerOffers)
    .leftJoin(cars, eq(dealerOffers.carId, cars.id))
    .leftJoin(dealers, eq(dealerOffers.toDealerId, dealers.id))
    .where(eq(dealerOffers.fromDealerId, dealerId))
    .orderBy(desc(dealerOffers.createdAt));

  // Offers received by this dealer
  const receivedOffers = await db
    .select()
    .from(dealerOffers)
    .leftJoin(cars, eq(dealerOffers.carId, cars.id))
    .leftJoin(dealers, eq(dealerOffers.fromDealerId, dealers.id))
    .where(eq(dealerOffers.toDealerId, dealerId))
    .orderBy(desc(dealerOffers.createdAt));

  return {
    made: madeOffers.map(row => ({
      offer: row.dealerOffers,
      car: row.cars,
      toDealer: row.dealers,
    })),
    received: receivedOffers.map(row => ({
      offer: row.dealerOffers,
      car: row.cars,
      fromDealer: row.dealers,
    })),
  };
}

/**
 * Respond to a dealer offer
 */
export async function respondToDealerOffer(data: {
  offerId: number;
  dealerId: number;
  action: 'accept' | 'reject' | 'counter';
  counterAmount?: number;
  counterMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify offer exists and belongs to this dealer
  const [offer] = await db
    .select()
    .from(dealerOffers)
    .where(eq(dealerOffers.id, data.offerId));

  if (!offer) {
    throw new Error('Offer not found');
  }

  if (offer.toDealerId !== data.dealerId) {
    throw new Error('Unauthorized: This offer is not for you');
  }

  if (offer.status !== 'pending' && offer.status !== 'countered') {
    throw new Error('This offer has already been responded to');
  }

  // Update offer status
  const updateData: any = {
    status: data.action === 'accept' ? 'accepted' : data.action === 'reject' ? 'rejected' : 'countered',
    updatedAt: new Date(),
  };

  if (data.action === 'counter') {
    updateData.counterAmount = data.counterAmount?.toString();
    updateData.counterMessage = data.counterMessage;
  }

  await db
    .update(dealerOffers)
    .set(updateData)
    .where(eq(dealerOffers.id, data.offerId));

  // If accepted, mark car as sold
  if (data.action === 'accept') {
    await db
      .update(cars)
      .set({ isAvailable: false })
      .where(eq(cars.id, offer.carId));
  }

  return { success: true };
}
