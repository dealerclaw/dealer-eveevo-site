import { eq, and, gte, lte, like, inArray, desc, sql, ne } from "drizzle-orm";
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
  type InsertDealerBid
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
    .select()
    .from(cars)
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

  return {
    totalListings,
    availableListings,
    totalViews,
    totalInquiries,
    newInquiries,
    recentInquiries,
    topListings,
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

  const result = await db.insert(dealers).values({
    userId,
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
  
  return await db
    .select()
    .from(cars)
    .where(
      and(
        eq(cars.marketplace, 'dealer_only'),
        eq(cars.isAuction, true),
        lte(cars.auctionStartDate, now),
        gte(cars.auctionEndDate, now)
      )
    )
    .orderBy(cars.auctionEndDate); // Ending soonest first
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
