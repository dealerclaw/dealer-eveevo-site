import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Reservation Checkout", () => {
  let ctx: Context;

  beforeAll(() => {
    // Mock authenticated user context
    ctx = {
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: "user",
      },
      req: {
        headers: {
          origin: "http://localhost:3000",
        },
      } as any,
      res: {} as any,
    };
  });

  it("should create Stripe checkout session for authenticated user", async () => {
    const caller = appRouter.createCaller(ctx);

    // Get first available car from database
    const cars = await caller.cars.list({ limit: 1 });
    if (cars.length === 0) {
      throw new Error("No cars in database for testing");
    }

    const result = await caller.reservations.createCheckout({
      carId: cars[0].id,
    });

    expect(result).toBeDefined();
    expect(result.checkoutUrl).toBeDefined();
    expect(typeof result.checkoutUrl).toBe("string");
    expect(result.checkoutUrl).toContain("checkout.stripe.com");
  });

  it("should fail for unauthenticated user", async () => {
    const unauthCtx = {
      ...ctx,
      user: null,
    };
    const caller = appRouter.createCaller(unauthCtx);

    await expect(
      caller.reservations.createCheckout({
        carId: 1,
      })
    ).rejects.toThrow();
  });

  it("should fail for non-existent car", async () => {
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.reservations.createCheckout({
        carId: 999999,
      })
    ).rejects.toThrow("Car not found");
  });
});
