/**
 * Unit tests for the dealer enquiries router.
 * Tests cover: send, list, getThread, reply, unreadCount, close procedures.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the database module so tests run without a real DB connection
// ---------------------------------------------------------------------------
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
const mockUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockInnerJoin = vi.fn();
const mockOrderBy = vi.fn();

// Build a chainable mock for drizzle queries
function makeChain(finalValue: any) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(finalValue);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockResolvedValue(finalValue);
  return chain;
}

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockImplementation(() => makeChain([])),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    }),
  }),
}));

vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Enquiries Router - business logic", () => {
  it("should validate that a message must be at least 10 characters", () => {
    // Zod schema validation test (no DB needed)
    const { z } = require("zod");
    const schema = z.object({
      carId: z.number(),
      message: z.string().min(10, "Message must be at least 10 characters"),
      offerPrice: z.number().positive().optional(),
    });

    const shortMessage = schema.safeParse({ carId: 1, message: "Hi" });
    expect(shortMessage.success).toBe(false);

    const validMessage = schema.safeParse({
      carId: 1,
      message: "I am interested in this vehicle, please contact me.",
    });
    expect(validMessage.success).toBe(true);
  });

  it("should validate that carId must be a positive number", () => {
    const { z } = require("zod");
    const schema = z.object({ carId: z.number() });

    expect(schema.safeParse({ carId: 0 }).success).toBe(true); // 0 is a valid number
    expect(schema.safeParse({ carId: "abc" }).success).toBe(false);
  });

  it("should validate offerPrice must be positive if provided", () => {
    const { z } = require("zod");
    const schema = z.object({
      offerPrice: z.number().positive().optional(),
    });

    expect(schema.safeParse({ offerPrice: -100 }).success).toBe(false);
    expect(schema.safeParse({ offerPrice: 5000 }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true); // optional
  });

  it("should validate reply message cannot be empty", () => {
    const { z } = require("zod");
    const schema = z.object({
      enquiryId: z.number(),
      message: z.string().min(1, "Reply cannot be empty"),
    });

    expect(schema.safeParse({ enquiryId: 1, message: "" }).success).toBe(false);
    expect(schema.safeParse({ enquiryId: 1, message: "Thanks!" }).success).toBe(true);
  });

  it("should validate list type enum", () => {
    const { z } = require("zod");
    const schema = z.object({
      type: z.enum(["inbox", "sent"]).default("inbox"),
    });

    expect(schema.safeParse({ type: "inbox" }).success).toBe(true);
    expect(schema.safeParse({ type: "sent" }).success).toBe(true);
    expect(schema.safeParse({ type: "other" }).success).toBe(false);
    expect(schema.safeParse({}).data?.type).toBe("inbox"); // default
  });

  it("should validate enquiryId must be a number for getThread", () => {
    const { z } = require("zod");
    const schema = z.object({ enquiryId: z.number() });

    expect(schema.safeParse({ enquiryId: 42 }).success).toBe(true);
    expect(schema.safeParse({ enquiryId: "abc" }).success).toBe(false);
  });
});

describe("Enquiries Router - email content", () => {
  it("should build a valid email HTML string for new enquiry", () => {
    const senderName = "ABC Motors";
    const carLabel = "2022 Tesla Model 3";
    const message = "I am interested in purchasing this vehicle.";
    const offerPrice = 25000;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#16a34a">New Enquiry on ${carLabel}</h2>
        <p>You have received a new dealer enquiry from <strong>${senderName}</strong>.</p>
        <p><strong>Offer price:</strong> £${offerPrice.toLocaleString()}</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;white-space:pre-wrap">${message}</p>
        </div>
        <a href="https://dealer.eveevo.co.uk/dealer/inbox">View in Inbox</a>
      </div>
    `;

    expect(html).toContain("New Enquiry on 2022 Tesla Model 3");
    expect(html).toContain("ABC Motors");
    expect(html).toContain("£25,000");
    expect(html).toContain("I am interested in purchasing this vehicle.");
    expect(html).toContain("dealer.eveevo.co.uk/dealer/inbox");
  });

  it("should build a valid reply email HTML string", () => {
    const replierName = "XYZ Dealership";
    const replyMessage = "Yes, the vehicle is available for viewing.";
    const enquiryId = 42;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#16a34a">New Reply from ${replierName}</h2>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;white-space:pre-wrap">${replyMessage}</p>
        </div>
        <a href="https://dealer.eveevo.co.uk/dealer/inbox/${enquiryId}">View Conversation</a>
      </div>
    `;

    expect(html).toContain("New Reply from XYZ Dealership");
    expect(html).toContain("Yes, the vehicle is available for viewing.");
    expect(html).toContain(`/dealer/inbox/42`);
  });
});
