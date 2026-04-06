/**
 * DealerClaw Sync Integration Tests
 * Validates secret checking and the upsert/delete helper logic (mocked DB).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock modules BEFORE importing the module under test ──────────────────────
// vi.mock is hoisted, so factory functions must not reference outer variables.

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../drizzle/schema", () => ({
  cars: { dealerClawCarId: "dealerClawCarId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}));

vi.mock("./firebaseSync", () => ({
  syncCarsFromFirebase: vi.fn(),
  syncDealersFromFirebase: vi.fn(),
}));

// Now import the module under test
import { upsertDealerClawCar, softDeleteDealerClawCar } from "./syncRouter";
import { getDb } from "./db";

// ── Secret validation ────────────────────────────────────────────────────────

describe("DEALERCLAW_SYNC_SECRET", () => {
  it("is set in the environment", () => {
    const secret = process.env.DEALERCLAW_SYNC_SECRET;
    expect(secret).toBeTruthy();
    expect(typeof secret).toBe("string");
    expect(secret!.length).toBeGreaterThan(8);
  });
});

// ── Shared test input ────────────────────────────────────────────────────────

const sampleInput = {
  dealerClawDealerId: 1,
  dealerClawCarId: 42,
  dealerName: "Test Motors",
  make: "Tesla",
  model: "Model 3",
  year: 2023,
  price: 4500000, // £45,000 in pence
  mileage: 12000,
  colour: "Pearl White",
  fuelType: "Electric",
  transmission: "Automatic",
  bodyType: "Saloon",
  registration: "AB23EVC",
  description: "Excellent condition Tesla Model 3",
  photoUrls: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
};

// ── upsertDealerClawCar ──────────────────────────────────────────────────────

describe("upsertDealerClawCar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeInsertMock(insertId = 999) {
    const valuesMock = vi.fn().mockResolvedValue([{ insertId }]);
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
    return { insertMock, valuesMock };
  }

  function makeSelectEmptyMock() {
    return vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
  }

  it("creates a new car when none exists", async () => {
    const { insertMock, valuesMock } = makeInsertMock(999);
    const mockDb = { select: makeSelectEmptyMock(), insert: insertMock };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await upsertDealerClawCar(sampleInput);
    expect(result.action).toBe("created");
    expect(insertMock).toHaveBeenCalledOnce();
    expect(valuesMock).toHaveBeenCalledOnce();
  });

  it("converts price from pence to pounds string", async () => {
    const { insertMock, valuesMock } = makeInsertMock(1);
    const mockDb = { select: makeSelectEmptyMock(), insert: insertMock };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await upsertDealerClawCar(sampleInput);
    const insertCall = valuesMock.mock.calls[0][0];
    expect(insertCall.price).toBe("45000");
  });

  it("sets mainImage to first photoUrl", async () => {
    const { insertMock, valuesMock } = makeInsertMock(1);
    const mockDb = { select: makeSelectEmptyMock(), insert: insertMock };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await upsertDealerClawCar(sampleInput);
    const insertCall = valuesMock.mock.calls[0][0];
    expect(insertCall.mainImage).toBe("https://example.com/photo1.jpg");
  });

  it("updates existing car when dealerClawCarId matches", async () => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 123 }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({ set: mockSet }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await upsertDealerClawCar(sampleInput);
    expect(result.action).toBe("updated");
    expect(result.id).toBe(123);
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("handles null price gracefully", async () => {
    const valuesMock = vi.fn().mockResolvedValue([{ insertId: 1 }]);
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insert: insertMock,
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await upsertDealerClawCar({ ...sampleInput, price: null });
    const insertCall = valuesMock.mock.calls[0][0];
    expect(insertCall.price).toBeNull();
  });
});

// ── softDeleteDealerClawCar ──────────────────────────────────────────────────

describe("softDeleteDealerClawCar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when car does not exist", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await softDeleteDealerClawCar(999);
    expect(result.action).toBe("not_found");
  });

  it("soft-deletes car by setting isAvailable false", async () => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 77 }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({ set: mockSet }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await softDeleteDealerClawCar(42);
    expect(result.action).toBe("deleted");
    expect(result.id).toBe(77);
    expect(mockDb.update).toHaveBeenCalledOnce();
    // Verify isAvailable: false was set
    const setCall = mockSet.mock.calls[0][0];
    expect(setCall.isAvailable).toBe(false);
  });
});
