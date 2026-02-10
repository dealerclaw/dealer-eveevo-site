import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as evDb from "./evDatabase";
import { syncRouter } from "./syncRouter";
import { importRouter } from "./importCars";

export const appRouter = router({
  system: systemRouter,
  sync: syncRouter,
  import: importRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Cars router
  cars: router({
    list: publicProcedure
      .input(z.object({
        make: z.string().optional(),
        model: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minRange: z.number().optional(),
        maxRange: z.number().optional(),
        minMileage: z.number().optional(),
        maxMileage: z.number().optional(),
        condition: z.enum(['new', 'used']).optional(),
        dealerId: z.number().optional(),
        isFeatured: z.boolean().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getCars(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCarById(input.id);
      }),

    getByIds: publicProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .query(async ({ input }) => {
        return await db.getCarsByIds(input.ids);
      }),

    featured: publicProcedure
      .query(async () => {
        return await db.getCars({ isFeatured: true, limit: 10 });
      }),
  }),

  // Dealers router
  dealers: router({
    list: publicProcedure
      .input(z.object({
        city: z.string().optional(),
        isVerified: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getDealers(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getDealerById(input.id);
      }),

    getCars: publicProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCars({ dealerId: input.dealerId });
      }),
  }),

  // Reservations router
  reservations: router({
    myReservations: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserReservations(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        carId: z.number(),
        dealerId: z.number().optional(),
        reservationDate: z.date(),
        viewingDate: z.date().optional(),
        userName: z.string().optional(),
        userEmail: z.string().email().optional(),
        userPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createReservation({
          userId: ctx.user.id,
          ...input,
        });
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
      }))
      .mutation(async ({ input }) => {
        await db.updateReservationStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // Favorites router
  favorites: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserFavorites(ctx.user.id);
      }),

    add: protectedProcedure
      .input(z.object({ carId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.addFavorite(ctx.user.id, input.carId);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ carId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(ctx.user.id, input.carId);
        return { success: true };
      }),
  }),

  // Saved searches router
  savedSearches: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserSavedSearches(ctx.user.id);
      }),

    save: protectedProcedure
      .input(z.object({
        name: z.string(),
        searchParams: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.saveSearch(ctx.user.id, input.name, input.searchParams);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSavedSearch(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // EV-Database router
  evDatabase: router({
    getAllSpecs: publicProcedure
      .query(async () => {
        return await evDb.getAllEVSpecs();
      }),

    searchSpecs: publicProcedure
      .input(z.object({
        make: z.string().optional(),
        model: z.string().optional(),
        minRange: z.number().optional(),
        maxRange: z.number().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        segment: z.string().optional(),
        seats: z.number().optional(),
        minBatteryCapacity: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await evDb.searchEVSpecs(input || {});
      }),

    getMakes: publicProcedure
      .query(async () => {
        return await evDb.getEVMakes();
      }),

    getModels: publicProcedure
      .input(z.object({ make: z.string() }))
      .query(async ({ input }) => {
        return await evDb.getEVModels(input.make);
      }),
  }),

  // Lifestyle search router
  lifestyle: router({
    search: publicProcedure
      .input(z.object({
        dailyMileage: z.number().optional(),
        primaryUse: z.enum(['city', 'highway', 'mixed']).optional(),
        passengers: z.number().optional(),
        budget: z.number().optional(),
        chargingAccess: z.enum(['home', 'public', 'both']).optional(),
        priorities: z.array(z.enum(['range', 'performance', 'space', 'price', 'luxury'])).optional(),
        bodyType: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        // Calculate required range based on daily mileage
        const requiredRange = input.dailyMileage 
          ? Math.ceil(input.dailyMileage * 7 * 1.3) // Weekly range with 30% buffer
          : 150; // Default minimum range
        
        // Build filter for local database
        const filters: any = {};
        
        if (requiredRange) {
          filters.minRange = requiredRange;
        }
        
        if (input.budget) {
          filters.maxPrice = input.budget;
        }
        
        // Get all matching cars from local database
        const allCars = await db.getCars(filters);
        
        // Separate new and used cars
        const newCars = allCars.filter(car => car.condition === 'new').slice(0, 20);
        const usedCars = allCars.filter(car => car.condition === 'used').slice(0, 20);
        
        // Generate recommendations
        const recommendations: string[] = [];
        
        if (input.dailyMileage && input.dailyMileage > 50) {
          recommendations.push(`With ${input.dailyMileage} miles daily, look for vehicles with at least ${requiredRange} miles of range.`);
        }
        
        if (input.chargingAccess === 'public') {
          recommendations.push('Consider vehicles with fast-charging capability since you rely on public charging.');
        }
        
        if (input.budget && input.budget < 25000) {
          recommendations.push('Used EVs offer excellent value. Consider models 2-3 years old for the best deals.');
        }
        
        if (input.priorities?.includes('range')) {
          recommendations.push('Focus on vehicles with larger battery capacities (60kWh+) for maximum range.');
        }
        
        if (input.priorities?.includes('performance')) {
          recommendations.push('Look for dual-motor AWD variants for better acceleration and performance.');
        }
        
        if (recommendations.length === 0) {
          recommendations.push('Browse our selection to find the perfect EV for your lifestyle.');
        }
        
        return {
          newCars,
          usedCars,
          recommendations,
        };
      }),
  }),

  // Finance router
  finance: router({
    createApplication: protectedProcedure
      .input(z.object({
        carId: z.number().optional(),
        loanAmount: z.number().optional(),
        depositAmount: z.number().optional(),
        term: z.number().optional(),
        applicantData: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createFinanceApplication({
          userId: ctx.user.id,
          ...input,
        });
      }),

    myApplications: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserFinanceApplications(ctx.user.id);
      }),

    updateApplication: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
        externalApplicationId: z.string().optional(),
        responseData: z.record(z.string(), z.any()).optional(),
        monthlyPayment: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFinanceApplication(id, data);
        return { success: true };
      }),
  }),

  // Dealer management router
  dealer: router({
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        // Check if user is a dealer
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        return await db.getDealerStats(ctx.user.id);
      }),

    getMyInventory: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        return await db.getDealerCars(ctx.user.id, input);
      }),

    addVehicle: protectedProcedure
      .input(z.object({
        make: z.string(),
        model: z.string(),
        year: z.number().optional(),
        price: z.number().optional(),
        mileage: z.number().optional(),
        condition: z.enum(['new', 'used']).optional(),
        bodyType: z.string().optional(),
        color: z.string().optional(),
        fuelType: z.string().optional(),
        transmission: z.string().optional(),
        batteryCapacity: z.number().optional(),
        realRange: z.number().optional(),
        chargingTime: z.string().optional(),
        acceleration: z.string().optional(),
        topSpeed: z.number().optional(),
        power: z.number().optional(),
        mainImage: z.string().optional(),
        images: z.array(z.string()).optional(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
        vin: z.string().optional(),
        registrationNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        return await db.addDealerCar(ctx.user.id, input);
      }),

    updateVehicle: protectedProcedure
      .input(z.object({
        id: z.number(),
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
        price: z.number().optional(),
        mileage: z.number().optional(),
        condition: z.enum(['new', 'used']).optional(),
        bodyType: z.string().optional(),
        color: z.string().optional(),
        fuelType: z.string().optional(),
        transmission: z.string().optional(),
        batteryCapacity: z.number().optional(),
        realRange: z.number().optional(),
        chargingTime: z.string().optional(),
        acceleration: z.string().optional(),
        topSpeed: z.number().optional(),
        power: z.number().optional(),
        mainImage: z.string().optional(),
        images: z.array(z.string()).optional(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
        vin: z.string().optional(),
        registrationNumber: z.string().optional(),
        isAvailable: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        const { id, ...data } = input;
        return await db.updateDealerCar(ctx.user.id, id, data);
      }),

    deleteVehicle: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        return await db.deleteDealerCar(ctx.user.id, input.id);
      }),

    getInquiries: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        return await db.getDealerInquiries(ctx.user.id);
      }),

    submitApplication: protectedProcedure
      .input(z.object({
        businessName: z.string(),
        contactName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        address: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Store dealer application
        // For now, we'll just log it and return success
        // In production, you'd store this in a dealer_applications table
        console.log('Dealer application received:', {
          userId: ctx.user.id,
          ...input,
        });
        
        // TODO: Store in database and notify admin
        // await db.createDealerApplication(ctx.user.id, input);
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
