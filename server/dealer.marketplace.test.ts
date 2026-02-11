import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Dealer Marketplace", () => {
  let dealerCtx: Context;
  let regularUserCtx: Context;

  beforeAll(() => {
    // Mock dealer context
    dealerCtx = {
      user: {
        id: 1,
        openId: "test-dealer",
        name: "Test Dealer",
        email: "dealer@example.com",
        role: "dealer",
      },
      req: {
        headers: {
          origin: "http://localhost:3000",
        },
      } as any,
      res: {} as any,
    };

    // Mock regular user context
    regularUserCtx = {
      user: {
        id: 2,
        openId: "test-user",
        name: "Test User",
        email: "user@example.com",
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

  it("should create subscription checkout for dealer", async () => {
    const caller = appRouter.createCaller(dealerCtx);

    const result = await caller.dealer.createSubscription();

    expect(result).toBeDefined();
    expect(result.checkoutUrl).toBeDefined();
    expect(typeof result.checkoutUrl).toBe("string");
    expect(result.checkoutUrl).toContain("checkout.stripe.com");
  });

  it("should fail to create subscription for non-dealer", async () => {
    const caller = appRouter.createCaller(regularUserCtx);

    await expect(
      caller.dealer.createSubscription()
    ).rejects.toThrow("Unauthorized: Dealer access required");
  });

  it("should get subscription status for dealer", async () => {
    const caller = appRouter.createCaller(dealerCtx);

    const result = await caller.dealer.getSubscriptionStatus();

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
    expect(['none', 'active', 'expired']).toContain(result.status);
  });

  it("should fail to access dealer marketplace without active subscription", async () => {
    const caller = appRouter.createCaller(dealerCtx);

    await expect(
      caller.dealer.getDealerMarketplace({ limit: 10 })
    ).rejects.toThrow("Active subscription required");
  });

  it("should move vehicle between marketplaces", async () => {
    const caller = appRouter.createCaller(dealerCtx);

    // Get first car from dealer inventory
    const inventory = await caller.dealer.getMyInventory({ limit: 1 });
    
    if (inventory.length > 0) {
      const carId = inventory[0].id;
      const currentMarketplace = inventory[0].marketplace || 'consumer';
      const newMarketplace = currentMarketplace === 'consumer' ? 'dealer_only' : 'consumer';

      const result = await caller.dealer.moveToMarketplace({
        carId,
        marketplace: newMarketplace,
      });

      expect(result.success).toBe(true);
    }
  });
});
