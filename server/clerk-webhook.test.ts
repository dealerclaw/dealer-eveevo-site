import { describe, expect, it } from "vitest";

describe("Clerk Webhook Secret", () => {
  it("CLERK_WEBHOOK_SECRET env var is set and non-empty", () => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    expect(typeof secret).toBe("string");
    expect((secret as string).length).toBeGreaterThan(10);
  });

  it("CLERK_WEBHOOK_SECRET starts with whsec_", () => {
    const secret = process.env.CLERK_WEBHOOK_SECRET ?? "";
    expect(secret.startsWith("whsec_")).toBe(true);
  });
});
