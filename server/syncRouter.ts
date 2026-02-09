/**
 * Sync Router - Endpoints for syncing data from Firebase
 */

import { publicProcedure, router } from "./_core/trpc";
import { syncCarsFromFirebase, syncDealersFromFirebase } from "./firebaseSync";

export const syncRouter = router({
  /**
   * Sync cars from Firebase to local database
   */
  syncCars: publicProcedure.mutation(async () => {
    try {
      const count = await syncCarsFromFirebase();
      return {
        success: true,
        message: `Successfully synced ${count} cars from Firebase`,
        count,
      };
    } catch (error) {
      console.error('[Sync] Error syncing cars:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync cars',
        count: 0,
      };
    }
  }),

  /**
   * Sync dealers from Firebase to local database
   */
  syncDealers: publicProcedure.mutation(async () => {
    try {
      const count = await syncDealersFromFirebase();
      return {
        success: true,
        message: `Successfully synced ${count} dealers from Firebase`,
        count,
      };
    } catch (error) {
      console.error('[Sync] Error syncing dealers:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync dealers',
        count: 0,
      };
    }
  }),

  /**
   * Sync all data from Firebase
   */
  syncAll: publicProcedure.mutation(async () => {
    try {
      const carCount = await syncCarsFromFirebase();
      const dealerCount = await syncDealersFromFirebase();
      
      return {
        success: true,
        message: `Successfully synced ${carCount} cars and ${dealerCount} dealers from Firebase`,
        carCount,
        dealerCount,
      };
    } catch (error) {
      console.error('[Sync] Error syncing all data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync data',
        carCount: 0,
        dealerCount: 0,
      };
    }
  }),
});
