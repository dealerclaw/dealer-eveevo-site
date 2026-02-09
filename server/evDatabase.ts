/**
 * EV-Database Integration
 * Fetches EV specifications from Firebase Realtime Database
 */

import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { realtimeDb } from '../client/src/lib/firebase';

export interface EVSpec {
  Vehicle_Make?: string;
  Vehicle_Model?: string;
  Vehicle_Variant?: string;
  Battery_Capacity?: number;
  Range_WLTP?: number;
  Range_Real?: number;
  Top_Speed?: number;
  Acceleration_0_100?: number;
  Power?: number;
  Torque?: number;
  Drive?: string;
  Seats?: number;
  Vehicle_Type?: string;
  Segment?: string;
  Price_From?: number;
  Fast_Charge_Speed?: number;
  [key: string]: any;
}

/**
 * Get all EV specifications from Firebase
 */
export async function getAllEVSpecs(): Promise<EVSpec[]> {
  try {
    const evDbRef = ref(realtimeDb, 'evDatabaseRaw');
    const snapshot = await get(evDbRef);
    
    if (!snapshot.exists()) {
      console.warn('[EVDatabase] No data found in evDatabaseRaw');
      return [];
    }
    
    const data = snapshot.val();
    const specs = Array.isArray(data) ? data : Object.values(data);
    
    return specs.filter((spec: any) => spec && spec.Vehicle_Make);
  } catch (error) {
    console.error('[EVDatabase] Error fetching EV specs:', error);
    return [];
  }
}

/**
 * Search EV specs by filters
 */
export async function searchEVSpecs(filters: {
  make?: string;
  model?: string;
  minRange?: number;
  maxRange?: number;
  minPrice?: number;
  maxPrice?: number;
  segment?: string;
  seats?: number;
  minBatteryCapacity?: number;
}): Promise<EVSpec[]> {
  try {
    let specs = await getAllEVSpecs();
    
    // Apply filters
    if (filters.make) {
      specs = specs.filter(spec => 
        spec.Vehicle_Make?.toLowerCase().includes(filters.make!.toLowerCase())
      );
    }
    
    if (filters.model) {
      specs = specs.filter(spec => 
        spec.Vehicle_Model?.toLowerCase().includes(filters.model!.toLowerCase())
      );
    }
    
    if (filters.minRange !== undefined) {
      specs = specs.filter(spec => 
        (spec.Range_WLTP || spec.Range_Real || 0) >= filters.minRange!
      );
    }
    
    if (filters.maxRange !== undefined) {
      specs = specs.filter(spec => 
        (spec.Range_WLTP || spec.Range_Real || 0) <= filters.maxRange!
      );
    }
    
    if (filters.minPrice !== undefined) {
      specs = specs.filter(spec => 
        (spec.Price_From || 0) >= filters.minPrice!
      );
    }
    
    if (filters.maxPrice !== undefined) {
      specs = specs.filter(spec => 
        spec.Price_From && spec.Price_From <= filters.maxPrice!
      );
    }
    
    if (filters.segment) {
      specs = specs.filter(spec => 
        spec.Segment?.toLowerCase() === filters.segment!.toLowerCase()
      );
    }
    
    if (filters.seats) {
      specs = specs.filter(spec => 
        spec.Seats && spec.Seats >= filters.seats!
      );
    }
    
    if (filters.minBatteryCapacity) {
      specs = specs.filter(spec => 
        (spec.Battery_Capacity || 0) >= filters.minBatteryCapacity!
      );
    }
    
    return specs;
  } catch (error) {
    console.error('[EVDatabase] Error searching EV specs:', error);
    return [];
  }
}

/**
 * Get unique makes from EV database
 */
export async function getEVMakes(): Promise<string[]> {
  try {
    const specs = await getAllEVSpecs();
    const makes = new Set(
      specs
        .map(spec => spec.Vehicle_Make)
        .filter((make): make is string => Boolean(make))
    );
    return Array.from(makes).sort();
  } catch (error) {
    console.error('[EVDatabase] Error getting makes:', error);
    return [];
  }
}

/**
 * Get models for a specific make
 */
export async function getEVModels(make: string): Promise<string[]> {
  try {
    const specs = await getAllEVSpecs();
    const models = new Set(
      specs
        .filter(spec => spec.Vehicle_Make?.toLowerCase() === make.toLowerCase())
        .map(spec => spec.Vehicle_Model)
        .filter((model): model is string => Boolean(model))
    );
    return Array.from(models).sort();
  } catch (error) {
    console.error('[EVDatabase] Error getting models:', error);
    return [];
  }
}

/**
 * Lifestyle search - match EVs to user lifestyle
 */
export interface LifestylePreferences {
  dailyMileage?: number;
  primaryUse?: 'city' | 'highway' | 'mixed';
  passengers?: number;
  budget?: number;
  chargingAccess?: 'home' | 'public' | 'both';
  priorities?: ('range' | 'performance' | 'space' | 'price' | 'luxury')[];
  bodyType?: string[];
}

export async function lifestyleSearch(preferences: LifestylePreferences): Promise<{
  newCars: EVSpec[];
  usedCars: any[];
  recommendations: string[];
}> {
  try {
    // Calculate required range based on daily mileage
    const requiredRange = preferences.dailyMileage 
      ? Math.ceil(preferences.dailyMileage * 7 * 1.3) // Weekly range with 30% buffer
      : 150; // Default minimum range
    
    // Search new cars from EV-Database
    const newCarFilters: any = {
      minRange: requiredRange,
    };
    
    if (preferences.budget) {
      newCarFilters.maxPrice = preferences.budget;
    }
    
    if (preferences.passengers) {
      newCarFilters.seats = preferences.passengers;
    }
    
    let newCars = await searchEVSpecs(newCarFilters);
    
    // Filter by body type if specified
    if (preferences.bodyType && preferences.bodyType.length > 0) {
      newCars = newCars.filter(car => 
        preferences.bodyType!.some(type => 
          car.Vehicle_Type?.toLowerCase().includes(type.toLowerCase()) ||
          car.Segment?.toLowerCase().includes(type.toLowerCase())
        )
      );
    }
    
    // Sort by priorities
    if (preferences.priorities && preferences.priorities.length > 0) {
      newCars.sort((a, b) => {
        for (const priority of preferences.priorities!) {
          switch (priority) {
            case 'range':
              return (b.Range_WLTP || b.Range_Real || 0) - (a.Range_WLTP || a.Range_Real || 0);
            case 'performance':
              return (a.Acceleration_0_100 || 999) - (b.Acceleration_0_100 || 999);
            case 'price':
              return (a.Price_From || 999999) - (b.Price_From || 999999);
            case 'space':
              return (b.Seats || 0) - (a.Seats || 0);
          }
        }
        return 0;
      });
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (preferences.dailyMileage && preferences.dailyMileage > 100) {
      recommendations.push('Consider a long-range EV with fast charging capability for your high daily mileage.');
    }
    
    if (preferences.chargingAccess === 'public') {
      recommendations.push('Look for EVs with fast DC charging support for convenient public charging.');
    }
    
    if (preferences.primaryUse === 'city') {
      recommendations.push('Compact EVs are ideal for city driving with easy parking and maneuverability.');
    }
    
    if (preferences.passengers && preferences.passengers >= 5) {
      recommendations.push('Consider SUVs or MPVs for comfortable seating for 5+ passengers.');
    }
    
    // For used cars, we'll return empty array for now
    // This will be populated from the local database in the router
    return {
      newCars: newCars.slice(0, 20), // Limit to top 20
      usedCars: [],
      recommendations,
    };
  } catch (error) {
    console.error('[EVDatabase] Error in lifestyle search:', error);
    return {
      newCars: [],
      usedCars: [],
      recommendations: ['Unable to process your preferences. Please try again.'],
    };
  }
}
