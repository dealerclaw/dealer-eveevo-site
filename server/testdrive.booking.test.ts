import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

describe("Test Drive Booking System", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testUserId: number;
  let testDealerId: number;
  let testCarId: number;

  beforeAll(async () => {
    // Use existing test dealer (anthony.m.perry@gmail.com)
    const dealers = await db.getDealers();
    if (dealers.length === 0) {
      throw new Error("No dealers in database for testing");
    }
    const dealer = dealers[0];
    testDealerId = dealer.id;
    testUserId = dealer.userId;

    // Get a test car (use existing car from database)
    const cars = await db.getCars({ limit: 1 });
    if (cars.length === 0) {
      throw new Error("No cars in database for testing");
    }
    testCarId = cars[0].id;

    // Create caller with authenticated dealer context
    const ctx: TrpcContext = {
      user: {
        id: testUserId,
        openId: "test-dealer-" + testUserId,
        name: "Test Dealer",
        email: "dealer@test.com",
        loginMethod: "email",
        role: "dealer",
        accountType: "business",
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    caller = appRouter.createCaller(ctx);
  });

  it("should create a test drive booking", async () => {
    const result = await caller.testDrive.create({
      carId: testCarId,
      dealerId: testDealerId,
      preferredDate: "2026-03-15",
      preferredTime: "10:00 AM",
      customerName: "John Customer",
      customerEmail: "customer@test.com",
      customerPhone: "+44 7700 900000",
      notes: "Looking forward to testing this vehicle",
    });

    expect(result.success).toBe(true);
  });

  it("should retrieve dealer test drive bookings", async () => {
    const bookings = await caller.testDrive.getDealerBookings();
    
    expect(Array.isArray(bookings)).toBe(true);
    expect(bookings.length).toBeGreaterThan(0);
    
    const booking = bookings[0];
    expect(booking).toHaveProperty("customerName");
    expect(booking).toHaveProperty("customerEmail");
    expect(booking).toHaveProperty("preferredDate");
    expect(booking).toHaveProperty("status");
  });

  it("should update booking status", async () => {
    // Get first booking
    const bookings = await caller.testDrive.getDealerBookings();
    const bookingId = bookings[0].id;

    const result = await caller.testDrive.updateStatus({
      bookingId,
      status: "confirmed",
    });

    expect(result.success).toBe(true);
  });
});
