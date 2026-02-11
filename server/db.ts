import { eq, and, gte, lte, like, inArray, desc, sql } from "drizzle-orm";
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
  type Car,
  type Dealer,
  type Reservation,
  type Favorite,
  type SavedSearch,
  type FinanceApplication,
  type CarView,
  type CarInquiry
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

  const result = await db.select().from(cars).where(eq(cars.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
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
    .select()
    .from(reservations)
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
  applicantData?: Record<string, any>;
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
