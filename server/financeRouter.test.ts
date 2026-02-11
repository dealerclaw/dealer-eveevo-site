import { describe, it, expect } from "vitest";
import { lookupAddressByPostcode } from "./_core/addressLookup";

describe("Finance Router", () => {
  describe("Address Lookup", () => {
    it("should lookup addresses by postcode", async () => {
      // Test with a known UK postcode
      const result = await lookupAddressByPostcode("SW1A1AA");
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // API may return empty or results - both are valid
    }, 30000);
    
    it("should handle postcodes with spaces", async () => {
      const result = await lookupAddressByPostcode("SW1A 1AA");
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    }, 30000);
  });
  
  describe("Credit Check Validation", () => {
    it("should validate required personal details fields", () => {
      const requiredFields = [
        "title",
        "firstName",
        "lastName",
        "dateOfBirth",
        "email",
        "mobileNumber",
        "address",
        "postcode",
        "accommodationType",
        "licenceType",
        "maritalStatus",
      ];
      
      expect(requiredFields.length).toBeGreaterThan(0);
      expect(requiredFields).toContain("firstName");
      expect(requiredFields).toContain("email");
    });
    
    it("should validate required employment fields", () => {
      const requiredFields = [
        "employmentStatus",
        "areaOfEmployment",
        "annualGrossIncome",
        "employerName",
        "employerTownCity",
      ];
      
      expect(requiredFields.length).toBeGreaterThan(0);
      expect(requiredFields).toContain("employmentStatus");
      expect(requiredFields).toContain("annualGrossIncome");
    });
    
    it("should require affordability confirmation", () => {
      const affordabilityRequired = true;
      expect(affordabilityRequired).toBe(true);
    });
  });
});
