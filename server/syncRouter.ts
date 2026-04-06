/**
 * Sync Router - Endpoints for syncing data from Firebase and DealerClaw
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { syncCarsFromFirebase, syncDealersFromFirebase } from "./firebaseSync";
import { getDb } from "./db";
import { cars, dealers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const DEALERCLAW_SECRET = process.env.DEALERCLAW_SYNC_SECRET || "";

export const syncRouter = router({
  // -----------------------------------------------------------------------
  // DealerClaw sync procedures
  // -----------------------------------------------------------------------

  pushCarFromDealerClaw: publicProcedure
    .input(
      z.object({
        secret: z.string(),
        dealerClawDealerId: z.number(),
        dealerClawCarId: z.number(),
        dealerName: z.string(),
        dealerEmail: z.string().optional(),
        dealerPhone: z.string().optional(),
        dealerAddress: z.string().optional(),
        make: z.string(),
        model: z.string(),
        year: z.number().nullable(),
        price: z.number().nullable(),        // in pence
        mileage: z.number().nullable(),
        colour: z.string().nullable(),
        fuelType: z.string().nullable(),
        transmission: z.string().nullable(),
        bodyType: z.string().nullable(),
        registration: z.string().nullable(),
        description: z.string().nullable(),
        photoUrls: z.array(z.string()),
        sourceUrl: z.string().optional(),
        condition: z.enum(["excellent", "good", "fair"]).optional(),
        keyFeatures: z.array(z.string()).optional(),
        rebeccaReview: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!DEALERCLAW_SECRET || input.secret !== DEALERCLAW_SECRET) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid sync secret" });
      }
      return await upsertDealerClawCar(input);
    }),

  deleteCarFromDealerClaw: publicProcedure
    .input(
      z.object({
        secret: z.string(),
        dealerClawCarId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      if (!DEALERCLAW_SECRET || input.secret !== DEALERCLAW_SECRET) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid sync secret" });
      }
      return await softDeleteDealerClawCar(input.dealerClawCarId);
    }),

  // -----------------------------------------------------------------------
  // Firebase sync procedures
  // -----------------------------------------------------------------------

  /**
   * Sync cars from Firebase to local database
   */
  syncCars: publicProcedure.mutation(async () => {
    try {
      const count = await syncCarsFromFirebase();
      return {
        success: true,
        message: `Successfully synced ${count} cars from Firebase`,
        count,
      };
    } catch (error) {
      console.error('[Sync] Error syncing cars:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync cars',
        count: 0,
      };
    }
  }),

  /**
   * Sync dealers from Firebase to local database
   */
  syncDealers: publicProcedure.mutation(async () => {
    try {
      const count = await syncDealersFromFirebase();
      return {
        success: true,
        message: `Successfully synced ${count} dealers from Firebase`,
        count,
      };
    } catch (error) {
      console.error('[Sync] Error syncing dealers:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync dealers',
        count: 0,
      };
    }
  }),

  /**
   * Sync all data from Firebase
   */
  syncAll: publicProcedure.mutation(async () => {
    try {
      const carCount = await syncCarsFromFirebase();
      const dealerCount = await syncDealersFromFirebase();
      
      return {
        success: true,
        message: `Successfully synced ${carCount} cars and ${dealerCount} dealers from Firebase`,
        carCount,
        dealerCount,
      };
    } catch (error) {
      console.error('[Sync] Error syncing all data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync data',
        carCount: 0,
        dealerCount: 0,
      };
    }
  }),
});

// -----------------------------------------------------------------------
// Shared helper functions (used by both tRPC procedures and REST endpoints)
// -----------------------------------------------------------------------

export type DealerClawCarInput = {
  dealerClawDealerId: number;
  dealerClawCarId: number;
  dealerName: string;
  dealerEmail?: string;
  dealerPhone?: string;
  dealerAddress?: string;
  make: string;
  model: string;
  year: number | null;
  price: number | null;  // in pence
  mileage: number | null;
  colour: string | null;
  fuelType: string | null;
  transmission: string | null;
  bodyType: string | null;
  registration: string | null;
  description: string | null;
  photoUrls: string[];
  sourceUrl?: string;
  condition?: "excellent" | "good" | "fair";
  keyFeatures?: string[];
  rebeccaReview?: string;
};

export async function upsertDealerClawCar(input: DealerClawCarInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(cars)
    .where(eq(cars.dealerClawCarId, input.dealerClawCarId))
    .limit(1);

  const priceInPounds = input.price ? String(Math.round(input.price / 100)) : null;
  const mainImage = input.photoUrls[0] || null;

  // Auto-link to EVEEVO dealer account if dealerClawDealerId matches
  let linkedDealerId: number | null = null;
  if (input.dealerClawDealerId) {
    const matchedDealer = await db
      .select({ id: dealers.id })
      .from(dealers)
      .where(eq(dealers.dealerClawDealerId, input.dealerClawDealerId))
      .limit(1);
    if (matchedDealer.length > 0) {
      linkedDealerId = matchedDealer[0].id;
      console.log(`[DealerClaw] Linked to EVEEVO dealer ID ${linkedDealerId} (DealerClaw dealer ${input.dealerClawDealerId})`);
    }
  }

  if (existing.length > 0) {
    await db
      .update(cars)
      .set({
        make: input.make,
        model: input.model,
        year: input.year,
        price: priceInPounds,
        mileage: input.mileage,
        color: input.colour,
        fuelType: input.fuelType,
        transmission: input.transmission,
        bodyType: input.bodyType,
        registrationNumber: input.registration,
        description: input.description,
        images: input.photoUrls.length > 0 ? input.photoUrls : null,
        mainImage,
        isAvailable: true,
        ...(linkedDealerId ? { dealerId: linkedDealerId } : {}),
        ...(input.rebeccaReview !== undefined ? { rebeccaReview: input.rebeccaReview } : {}),
        updatedAt: new Date(),
      })
      .where(eq(cars.dealerClawCarId, input.dealerClawCarId));

    console.log(`[DealerClaw] Updated car ID ${existing[0].id} (DealerClaw car ${input.dealerClawCarId})`);
    return { action: "updated" as const, id: existing[0].id };
  } else {
    const result = await db.insert(cars).values({
      dealerClawCarId: input.dealerClawCarId,
      dealerClawDealerId: input.dealerClawDealerId,
      ...(linkedDealerId ? { dealerId: linkedDealerId } : {}),
      make: input.make,
      model: input.model,
      year: input.year,
      price: priceInPounds,
      mileage: input.mileage,
      color: input.colour,
      fuelType: input.fuelType,
      transmission: input.transmission,
      bodyType: input.bodyType,
      registrationNumber: input.registration,
      description: input.description,
      images: input.photoUrls.length > 0 ? input.photoUrls : null,
      mainImage,
      isAvailable: true,
      isFeatured: false,
      marketplace: "consumer",
      isAuction: false,
      condition: "used",
      ...(input.rebeccaReview !== undefined ? { rebeccaReview: input.rebeccaReview } : {}),
    });

    const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
    console.log(`[DealerClaw] Created new car ID ${insertId} (DealerClaw car ${input.dealerClawCarId})`);
    return { action: "created" as const, id: insertId };
  }
}

export async function softDeleteDealerClawCar(dealerClawCarId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select({ id: cars.id })
    .from(cars)
    .where(eq(cars.dealerClawCarId, dealerClawCarId))
    .limit(1);

  if (existing.length === 0) {
    return { action: "not_found" as const };
  }

  await db
    .update(cars)
    .set({ isAvailable: false, updatedAt: new Date() })
    .where(eq(cars.dealerClawCarId, dealerClawCarId));

  console.log(`[DealerClaw] Soft-deleted car ID ${existing[0].id} (DealerClaw car ${dealerClawCarId})`);
  return { action: "deleted" as const, id: existing[0].id };
}

// ─────────────────────────────────────────────────────────────────────────────
// Outbound webhook: notify DealerClaw when a car is reserved or sold
// ─────────────────────────────────────────────────────────────────────────────

const DEALERCLAW_WEBHOOK_URL = process.env.DEALERCLAW_WEBHOOK_URL || "";

export type DealerClawEventType = "reserved" | "sold" | "reservation_cancelled";

export interface DealerClawNotifyPayload {
  event: DealerClawEventType;
  dealerClawCarId: number;
  dealerClawDealerId?: number | null;
  eveevoCarId: number;
  eveevoReservationId?: number;
  buyerEmail?: string;
  buyerName?: string;
  salePrice?: string | null;
  timestamp: string;
}

/**
 * Notify DealerClaw of a status change on one of their synced cars.
 * Non-blocking — logs errors but never throws, so it won't break the main flow.
 */
export async function notifyDealerClaw(payload: DealerClawNotifyPayload): Promise<void> {
  if (!DEALERCLAW_WEBHOOK_URL) {
    console.log("[DealerClaw] DEALERCLAW_WEBHOOK_URL not set, skipping notification");
    return;
  }

  try {
    const res = await fetch(DEALERCLAW_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-EVEEVO-Secret": DEALERCLAW_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[DealerClaw] Webhook responded ${res.status} for event ${payload.event} on car ${payload.dealerClawCarId}`);
    } else {
      console.log(`[DealerClaw] Webhook sent: ${payload.event} for DealerClaw car ${payload.dealerClawCarId}`);
    }
  } catch (err) {
    console.error("[DealerClaw] Webhook failed (non-fatal):", err);
  }
}

/**
 * Convenience: look up a car's DealerClaw IDs and fire the webhook if it's a DealerClaw car.
 * Pass carId (EVEEVO DB id) and the event type.
 */
export async function notifyDealerClawForCar(
  carId: number,
  event: DealerClawEventType,
  extras: Partial<Omit<DealerClawNotifyPayload, "event" | "dealerClawCarId" | "eveevoCarId" | "timestamp">> = {}
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const row = await db
    .select({ dealerClawCarId: cars.dealerClawCarId, dealerClawDealerId: cars.dealerClawDealerId })
    .from(cars)
    .where(eq(cars.id, carId))
    .limit(1);

  if (!row.length || !row[0].dealerClawCarId) return; // Not a DealerClaw car

  await notifyDealerClaw({
    event,
    dealerClawCarId: row[0].dealerClawCarId,
    dealerClawDealerId: row[0].dealerClawDealerId,
    eveevoCarId: carId,
    timestamp: new Date().toISOString(),
    ...extras,
  });
}
