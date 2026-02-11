import { describe, it, expect } from "vitest";
import { getAllDealers, getDealerById, getDealerCarsAdmin } from "./adminDb";

describe("Admin Dealers Management", () => {
  describe("getAllDealers", () => {
    it("should return an array of dealers", async () => {
      const dealers = await getAllDealers();
      
      expect(Array.isArray(dealers)).toBe(true);
      // Database may be empty or populated
      if (dealers.length > 0) {
        const dealer = dealers[0];
        expect(dealer).toHaveProperty("id");
        expect(dealer).toHaveProperty("name");
        expect(dealer).toHaveProperty("carCount");
      }
    });
  });
  
  describe("getDealerById", () => {
    it("should return null for non-existent dealer", async () => {
      const dealer = await getDealerById(999999);
      expect(dealer).toBeNull();
    });
    
    it("should return dealer details if exists", async () => {
      const dealers = await getAllDealers();
      if (dealers.length > 0) {
        const dealerId = dealers[0].id;
        const dealer = await getDealerById(dealerId);
        
        expect(dealer).not.toBeNull();
        expect(dealer?.id).toBe(dealerId);
        expect(dealer).toHaveProperty("name");
        expect(dealer).toHaveProperty("email");
      }
    });
  });
  
  describe("getDealerCarsAdmin", () => {
    it("should return empty array for dealer with no cars", async () => {
      const cars = await getDealerCarsAdmin(999999);
      expect(Array.isArray(cars)).toBe(true);
      expect(cars.length).toBe(0);
    });
    
    it("should return cars array for valid dealer", async () => {
      const dealers = await getAllDealers();
      if (dealers.length > 0) {
        const dealerWithCars = dealers.find(d => d.carCount > 0);
        if (dealerWithCars) {
          const cars = await getDealerCarsAdmin(dealerWithCars.id);
          
          expect(Array.isArray(cars)).toBe(true);
          expect(cars.length).toBeGreaterThan(0);
          expect(cars[0]).toHaveProperty("id");
          expect(cars[0]).toHaveProperty("make");
          expect(cars[0]).toHaveProperty("model");
        }
      }
    });
  });
});
