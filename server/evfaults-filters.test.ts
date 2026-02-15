import { describe, it, expect, beforeAll } from 'vitest';
import { getEvFaultsByModel, getAllFaultMakes, getAllFaultModels } from './db';

describe('EV Faults Database Filtering', () => {
  beforeAll(async () => {
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('getAllFaultMakes', () => {
    it('should return all unique makes', async () => {
      const makes = await getAllFaultMakes();
      
      expect(makes).toBeDefined();
      expect(Array.isArray(makes)).toBe(true);
      expect(makes.length).toBeGreaterThan(0);
      
      // Should include the makes we imported
      expect(makes).toContain('Tesla');
      expect(makes).toContain('Nissan');
      expect(makes).toContain('BMW');
      expect(makes).toContain('Volkswagen');
      expect(makes).toContain('Hyundai');
      expect(makes).toContain('Renault');
      expect(makes).toContain('MG');
      expect(makes).toContain('Polestar');
    });
  });

  describe('getAllFaultModels', () => {
    it('should return all models for Tesla', async () => {
      const models = await getAllFaultModels('Tesla');
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models).toContain('Model 3');
    });

    it('should return all models for Nissan', async () => {
      const models = await getAllFaultModels('Nissan');
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models).toContain('Leaf');
    });

    it('should return all models for Volkswagen', async () => {
      const models = await getAllFaultModels('Volkswagen');
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models).toContain('ID.3');
      expect(models).toContain('ID.4');
    });
  });

  describe('getEvFaultsByModel - Basic Filtering', () => {
    it('should return faults for Tesla Model 3', async () => {
      const faults = await getEvFaultsByModel('Tesla', 'Model 3');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBeGreaterThan(0);
      
      // All faults should be for Tesla Model 3
      faults.forEach(fault => {
        expect(fault.make).toBe('Tesla');
        expect(fault.model).toBe('Model 3');
      });
    });

    it('should return all faults for Nissan (all models)', async () => {
      const faults = await getEvFaultsByModel('Nissan');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBeGreaterThan(0);
      
      // All faults should be for Nissan
      faults.forEach(fault => {
        expect(fault.make).toBe('Nissan');
      });
    });
  });

  describe('getEvFaultsByModel - Category Filtering', () => {
    it('should filter by battery category', async () => {
      const faults = await getEvFaultsByModel('Tesla', undefined, 'battery');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All returned faults should be battery-related
      faults.forEach(fault => {
        expect(fault.category).toBe('battery');
      });
    });

    it('should filter by charging category', async () => {
      const faults = await getEvFaultsByModel('Nissan', undefined, 'charging');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All returned faults should be charging-related
      faults.forEach(fault => {
        expect(fault.category).toBe('charging');
      });
    });

    it('should filter by electrical category', async () => {
      const faults = await getEvFaultsByModel('BMW', undefined, 'electrical');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All returned faults should be electrical-related
      faults.forEach(fault => {
        expect(fault.category).toBe('electrical');
      });
    });
  });

  describe('getEvFaultsByModel - Severity Filtering', () => {
    it('should filter by critical severity', async () => {
      const faults = await getEvFaultsByModel('Volkswagen', undefined, undefined, 'critical');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All returned faults should be critical
      faults.forEach(fault => {
        expect(fault.severity).toBe('critical');
      });
    });

    it('should filter by high severity', async () => {
      const faults = await getEvFaultsByModel('Hyundai', undefined, undefined, 'high');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All returned faults should be high severity
      faults.forEach(fault => {
        expect(fault.severity).toBe('high');
      });
    });

    it('should filter by medium severity', async () => {
      const faults = await getEvFaultsByModel('MG', undefined, undefined, 'medium');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All returned faults should be medium severity
      faults.forEach(fault => {
        expect(fault.severity).toBe('medium');
      });
    });

    it('should filter by low severity', async () => {
      const faults = await getEvFaultsByModel('Polestar', undefined, undefined, 'low');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All returned faults should be low severity
      faults.forEach(fault => {
        expect(fault.severity).toBe('low');
      });
    });
  });

  describe('getEvFaultsByModel - Text Search', () => {
    it('should search by problem title', async () => {
      const faults = await getEvFaultsByModel('Tesla', undefined, undefined, undefined, 'battery');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBeGreaterThan(0);
      
      // At least one fault should contain "battery" in title, description, or symptoms
      const hasMatch = faults.some(fault => 
        fault.problemTitle.toLowerCase().includes('battery') ||
        fault.description?.toLowerCase().includes('battery') ||
        fault.symptoms?.toLowerCase().includes('battery')
      );
      expect(hasMatch).toBe(true);
    });

    it('should search by description content', async () => {
      const faults = await getEvFaultsByModel('Nissan', undefined, undefined, undefined, 'degradation');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // At least one fault should contain "degradation" somewhere
      const hasMatch = faults.some(fault => 
        fault.problemTitle.toLowerCase().includes('degradation') ||
        fault.description?.toLowerCase().includes('degradation') ||
        fault.symptoms?.toLowerCase().includes('degradation')
      );
      expect(hasMatch).toBe(true);
    });

    it('should search by symptoms', async () => {
      const faults = await getEvFaultsByModel('BMW', undefined, undefined, undefined, 'warning');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBeGreaterThan(0);
      
      // At least one fault should contain "warning" in symptoms
      const hasMatch = faults.some(fault => 
        fault.symptoms?.toLowerCase().includes('warning')
      );
      expect(hasMatch).toBe(true);
    });
  });

  describe('getEvFaultsByModel - Combined Filters', () => {
    it('should filter by model + category', async () => {
      const faults = await getEvFaultsByModel('Volkswagen', 'ID.4', 'battery');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All faults should match all criteria
      faults.forEach(fault => {
        expect(fault.make).toBe('Volkswagen');
        expect(fault.model).toBe('ID.4');
        expect(fault.category).toBe('battery');
      });
    });

    it('should filter by category + severity', async () => {
      const faults = await getEvFaultsByModel('Renault', undefined, 'charging', 'critical');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All faults should match all criteria
      faults.forEach(fault => {
        expect(fault.make).toBe('Renault');
        expect(fault.category).toBe('charging');
        expect(fault.severity).toBe('critical');
      });
    });

    it('should filter by model + category + severity + search', async () => {
      const faults = await getEvFaultsByModel('Polestar', '2', 'infotainment', 'medium', 'screen');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      
      // All faults should match all criteria
      faults.forEach(fault => {
        expect(fault.make).toBe('Polestar');
        expect(fault.model).toBe('2');
        expect(fault.category).toBe('infotainment');
        expect(fault.severity).toBe('medium');
        
        // Should contain "screen" somewhere
        const containsScreen = 
          fault.problemTitle.toLowerCase().includes('screen') ||
          fault.description?.toLowerCase().includes('screen') ||
          fault.symptoms?.toLowerCase().includes('screen');
        expect(containsScreen).toBe(true);
      });
    });
  });

  describe('getEvFaultsByModel - Edge Cases', () => {
    it('should return empty array for non-existent make', async () => {
      const faults = await getEvFaultsByModel('NonExistentMake');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBe(0);
    });

    it('should return empty array for non-existent model', async () => {
      const faults = await getEvFaultsByModel('Tesla', 'NonExistentModel');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBe(0);
    });

    it('should return empty array when no faults match filters', async () => {
      const faults = await getEvFaultsByModel('Tesla', undefined, undefined, undefined, 'impossiblesearchterm12345');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    it('should have imported all 8 makes', async () => {
      const makes = await getAllFaultMakes();
      expect(makes.length).toBe(8);
    });

    it('should have imported at least 134 total faults', async () => {
      const makes = await getAllFaultMakes();
      let totalFaults = 0;
      
      for (const make of makes) {
        const faults = await getEvFaultsByModel(make);
        totalFaults += faults.length;
      }
      
      expect(totalFaults).toBeGreaterThanOrEqual(134);
    });

    it('should have all required fields populated', async () => {
      const faults = await getEvFaultsByModel('Tesla', 'Model 3');
      
      expect(faults.length).toBeGreaterThan(0);
      
      faults.forEach(fault => {
        expect(fault.make).toBeDefined();
        expect(fault.model).toBeDefined();
        expect(fault.problemTitle).toBeDefined();
        expect(fault.description).toBeDefined();
        expect(fault.symptoms).toBeDefined();
        expect(fault.resolution).toBeDefined();
        expect(fault.category).toBeDefined();
        expect(fault.severity).toBeDefined();
        expect(fault.frequency).toBeDefined();
      });
    });
  });
});
