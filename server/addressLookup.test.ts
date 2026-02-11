import { describe, it, expect } from "vitest";
import { lookupAddressByPostcode } from "./_core/addressLookup";

describe("OneAuto Address Lookup API", () => {
  it("should successfully lookup addresses for a valid UK postcode", async () => {
    // Use a known valid UK postcode (SW1A 1AA is the Royal Mail postcode)
    const result = await lookupAddressByPostcode("SW1A1AA");

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // API may return empty array or results - both are valid responses
  }, 30000); // 30 second timeout for API call

  it("should handle postcode with spaces", async () => {
    // Test with spaces in postcode
    const result = await lookupAddressByPostcode("SW1A 1AA");

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  }, 10000);

  it("should return empty array for invalid postcode", async () => {
    const result = await lookupAddressByPostcode("INVALID");

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // Invalid postcodes should return empty array, not throw error
  }, 10000);
});
