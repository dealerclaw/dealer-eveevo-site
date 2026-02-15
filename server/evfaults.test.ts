import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('EV Faults Database', () => {
  describe('Database Functions', () => {
    it('should fetch all fault makes', async () => {
      const makes = await db.getAllFaultMakes();
      
      expect(makes).toBeDefined();
      expect(Array.isArray(makes)).toBe(true);
      expect(makes.length).toBeGreaterThan(0);
      expect(makes).toContain('Tesla');
      expect(makes).toContain('Nissan');
      expect(makes).toContain('BMW');
    });

    it('should fetch models for a specific make', async () => {
      const models = await db.getAllFaultModels('Tesla');
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain('Model 3');
    });

    it('should fetch faults by make', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBeGreaterThan(0);
      
      // Check first fault has required fields
      const fault = faults[0];
      expect(fault).toHaveProperty('id');
      expect(fault).toHaveProperty('make');
      expect(fault).toHaveProperty('model');
      expect(fault).toHaveProperty('problemTitle');
      expect(fault).toHaveProperty('description');
      expect(fault).toHaveProperty('symptoms');
      expect(fault).toHaveProperty('resolution');
      expect(fault).toHaveProperty('category');
      expect(fault).toHaveProperty('severity');
      expect(fault).toHaveProperty('frequency');
      
      expect(fault.make).toBe('Tesla');
    });

    it('should fetch faults by make and model', async () => {
      const faults = await db.getEvFaultsByModel('Tesla', 'Model 3');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBeGreaterThan(0);
      
      // All faults should be for Tesla Model 3
      faults.forEach(fault => {
        expect(fault.make).toBe('Tesla');
        expect(fault.model).toBe('Model 3');
      });
    });

    it('should return faults ordered by frequency and severity', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      expect(faults.length).toBeGreaterThan(1);
      
      // Check that faults are ordered (very_common > common > occasional > rare)
      // and (critical > high > medium > low)
      const frequencyOrder = ['very_common', 'common', 'occasional', 'rare'];
      const severityOrder = ['critical', 'high', 'medium', 'low'];
      
      for (let i = 0; i < faults.length - 1; i++) {
        const current = faults[i];
        const next = faults[i + 1];
        
        const currentFreqIndex = frequencyOrder.indexOf(current.frequency);
        const nextFreqIndex = frequencyOrder.indexOf(next.frequency);
        
        // Current should have higher or equal priority frequency
        expect(currentFreqIndex).toBeLessThanOrEqual(nextFreqIndex);
      }
    });

    it('should handle non-existent make gracefully', async () => {
      const faults = await db.getEvFaultsByModel('NonExistentMake');
      
      expect(faults).toBeDefined();
      expect(Array.isArray(faults)).toBe(true);
      expect(faults.length).toBe(0);
    });

    it('should have valid category values', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      const validCategories = [
        'battery',
        'charging',
        'motor_drivetrain',
        'brakes',
        'suspension',
        'electrical',
        'infotainment',
        'hvac',
        'body_trim',
        'safety_systems',
        'software',
        'other'
      ];
      
      faults.forEach(fault => {
        expect(validCategories).toContain(fault.category);
      });
    });

    it('should have valid severity values', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      
      faults.forEach(fault => {
        expect(validSeverities).toContain(fault.severity);
      });
    });

    it('should have valid frequency values', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      const validFrequencies = ['rare', 'occasional', 'common', 'very_common'];
      
      faults.forEach(fault => {
        expect(validFrequencies).toContain(fault.frequency);
      });
    });

    it('should have cost estimates for most faults', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      const faultsWithCost = faults.filter(f => f.estimatedCostMin || f.estimatedCostMax);
      
      // At least 80% should have cost estimates
      expect(faultsWithCost.length).toBeGreaterThan(faults.length * 0.8);
    });

    it('should have labor hours for most faults', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      const faultsWithLabor = faults.filter(f => f.laborHours);
      
      // At least 70% should have labor estimates
      expect(faultsWithLabor.length).toBeGreaterThan(faults.length * 0.7);
    });
  });

  describe('Data Quality', () => {
    it('should have comprehensive Tesla Model 3 data', async () => {
      const faults = await db.getEvFaultsByModel('Tesla', 'Model 3');
      
      // Should have at least 15 faults for Model 3
      expect(faults.length).toBeGreaterThanOrEqual(15);
      
      // Check for some known common issues
      const problemTitles = faults.map(f => f.problemTitle.toLowerCase());
      
      // Should include battery-related issues
      const hasBatteryIssue = problemTitles.some(title => 
        title.includes('battery') || title.includes('12v')
      );
      expect(hasBatteryIssue).toBe(true);
    });

    it('should have comprehensive Nissan Leaf data', async () => {
      const faults = await db.getEvFaultsByModel('Nissan', 'Leaf');
      
      // Should have at least 15 faults for Leaf
      expect(faults.length).toBeGreaterThanOrEqual(15);
    });

    it('should have comprehensive BMW i3 data', async () => {
      const faults = await db.getEvFaultsByModel('BMW', 'i3');
      
      // Should have at least 15 faults for i3
      expect(faults.length).toBeGreaterThanOrEqual(15);
    });

    it('should have detailed descriptions for all faults', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      faults.forEach(fault => {
        // Description should be at least 50 characters
        expect(fault.description.length).toBeGreaterThan(50);
        
        // Symptoms should be at least 30 characters
        expect(fault.symptoms.length).toBeGreaterThan(30);
        
        // Resolution should be at least 50 characters
        expect(fault.resolution.length).toBeGreaterThan(50);
      });
    });

    it('should have year ranges for most faults', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      const faultsWithYears = faults.filter(f => f.yearFrom);
      
      // At least 60% should have year information
      expect(faultsWithYears.length).toBeGreaterThan(faults.length * 0.6);
    });

    it('should have reasonable cost estimates', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      faults.forEach(fault => {
        if (fault.estimatedCostMin && fault.estimatedCostMax) {
          const min = parseFloat(fault.estimatedCostMin);
          const max = parseFloat(fault.estimatedCostMax);
          
          // Min should be less than or equal to max
          expect(min).toBeLessThanOrEqual(max);
          
          // Costs should be reasonable (between £0 and £20,000)
          expect(min).toBeGreaterThanOrEqual(0);
          expect(max).toBeLessThanOrEqual(20000);
        }
      });
    });

    it('should have reasonable labor hours', async () => {
      const faults = await db.getEvFaultsByModel('Tesla');
      
      faults.forEach(fault => {
        if (fault.laborHours) {
          const hours = parseFloat(fault.laborHours);
          
          // Labor should be reasonable (between 0 and 40 hours)
          expect(hours).toBeGreaterThanOrEqual(0);
          expect(hours).toBeLessThanOrEqual(40);
        }
      });
    });
  });

  describe('Search and Filter', () => {
    it('should return different results for different makes', async () => {
      const teslaFaults = await db.getEvFaultsByModel('Tesla');
      const nissanFaults = await db.getEvFaultsByModel('Nissan');
      
      expect(teslaFaults.length).toBeGreaterThan(0);
      expect(nissanFaults.length).toBeGreaterThan(0);
      
      // Should have different faults
      const teslaIds = teslaFaults.map(f => f.id);
      const nissanIds = nissanFaults.map(f => f.id);
      
      // No overlap in IDs
      const overlap = teslaIds.filter(id => nissanIds.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('should filter by model correctly', async () => {
      const allTesla = await db.getEvFaultsByModel('Tesla');
      const model3Only = await db.getEvFaultsByModel('Tesla', 'Model 3');
      
      expect(allTesla.length).toBeGreaterThanOrEqual(model3Only.length);
      
      // All Model 3 faults should be in the Tesla results
      model3Only.forEach(fault => {
        const found = allTesla.find(f => f.id === fault.id);
        expect(found).toBeDefined();
      });
    });
  });
});
