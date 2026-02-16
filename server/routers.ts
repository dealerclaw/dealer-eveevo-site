import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import * as db from "./db";
import * as evDb from "./evDatabase";
import { syncRouter } from "./syncRouter";
import { importRouter } from "./importCars";
import { financeRouter } from "./financeRouter";
import Stripe from "stripe";
import { PRODUCTS } from "./products";
import { notifyOwner } from "./_core/notification";
import { calculatePostcodeDistance } from "./postcodeDistance";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  sync: syncRouter,
  import: importRouter,
  finance: financeRouter,
  
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

    getSimilarCars: publicProcedure
      .input(z.object({ 
        carId: z.number(),
        limit: z.number().default(4)
      }))
      .query(async ({ input }) => {
        return await db.getSimilarCars(input.carId, input.limit);
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

    listForFilter: publicProcedure
      .query(async () => {
        return await db.getAllDealersForFilter();
      }),

    getProfile: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getDealerById(input.id);
      }),

    getInventory: publicProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCars({ dealerId: input.dealerId, marketplace: 'consumer' });
      }),

    getReviews: publicProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDealerReviews(input.dealerId);
      }),

    getDealerWinStats: publicProcedure
      .input(z.object({ dealerId: z.number() }))
      .query(async ({ input }) => {
        const { getDealerWinStats } = await import('./dealerWinStats');
        return await getDealerWinStats(input.dealerId);
      }),

    submitReview: protectedProcedure
      .input(z.object({
        dealerId: z.number(),
        rating: z.number().min(1).max(5),
        reviewText: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.submitDealerReview({
          dealerId: input.dealerId,
          userId: ctx.user.id,
          rating: input.rating,
          reviewText: input.reviewText,
        });
        return { success: true };
      }),
  }),

  // Reservations router
  reservations: router({
    myReservations: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserReservations(ctx.user.id);
      }),

    createCheckout: protectedProcedure
      .input(z.object({
        carId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        
        // Get car details
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Car not found');
        }

        const product = PRODUCTS.VEHICLE_RESERVATION;
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: product.currency,
                product_data: {
                  name: product.name,
                  description: `${product.description} - ${car.make} ${car.model}`,
                  metadata: product.metadata,
                },
                unit_amount: product.price,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${ctx.req.headers.origin}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${ctx.req.headers.origin}/car/${input.carId}`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
            car_id: input.carId.toString(),
            car_make: car.make,
            car_model: car.model,
          },
          allow_promotion_codes: true,
        });

        return { checkoutUrl: session.url };
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
        stripeSessionId: z.string().optional(),
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

  // Finance router (imported from financeRouter.ts)

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
        conditionNotes: z.string().optional(),
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

    uploadInspectionReport: protectedProcedure
      .input(z.object({
        carId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64
        fileType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Verify car belongs to dealer
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Car not found');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer || car.dealerId !== dealer.id) {
          throw new Error('Unauthorized: You can only upload reports for your own vehicles');
        }

        // Upload to S3
        const { storagePut } = await import('./storage');
        const base64Data = input.fileData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileKey = `inspection-reports/${dealer.id}/${input.carId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        // Update car with new report
        const existingReports = car.inspectionReports || [];
        const newReport = {
          url,
          name: input.fileName,
          type: input.fileType,
          uploadedAt: new Date().toISOString(),
        };
        const updatedReports = [...existingReports, newReport];

        await db.updateDealerCar(ctx.user.id, input.carId, {
          inspectionReports: updatedReports,
        });

        return { report: newReport };
      }),

    deleteInspectionReport: protectedProcedure
      .input(z.object({
        carId: z.number(),
        reportUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Verify car belongs to dealer
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Car not found');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer || car.dealerId !== dealer.id) {
          throw new Error('Unauthorized: You can only delete reports for your own vehicles');
        }

        // Remove report from list
        const existingReports = car.inspectionReports || [];
        const updatedReports = existingReports.filter(r => r.url !== input.reportUrl);

        await db.updateDealerCar(ctx.user.id, input.carId, {
          inspectionReports: updatedReports,
        });

        return { success: true };
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
        // Store dealer application in database
        const application = await db.createDealerApplication(ctx.user.id, input);
        
        // Send email notification to admin
        const { sendDealerApplicationEmail } = await import('./_core/email');
        await sendDealerApplicationEmail(input);
        
        console.log('[Dealer Application] New application submitted:', {
          id: application.id,
          businessName: input.businessName,
        });
        
        return { success: true, applicationId: application.id };
      }),

    // Subscription management
    createSubscription: protectedProcedure
      .input(z.object({
        referralCode: z.string().optional(),
      }).optional())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const product = PRODUCTS.DEALER_SUBSCRIPTION;
        
        // Get dealer info
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        // Create Stripe checkout session for subscription
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: product.currency,
                product_data: {
                  name: product.name,
                  description: product.description,
                  metadata: product.metadata,
                },
                unit_amount: product.price,
                recurring: {
                  interval: product.interval,
                },
              },
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${ctx.req.headers.origin}/dealer/subscription/success`,
          cancel_url: `${ctx.req.headers.origin}/dealer/subscription`,
          customer_email: ctx.user.email || undefined,
          phone_number_collection: {
            enabled: false,
          },
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            dealer_id: dealer.id.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
            referralCode: input?.referralCode || '',
          },
          subscription_data: {
            trial_period_days: 7,
          },
          allow_promotion_codes: true,
        });

        return { checkoutUrl: session.url };
      }),

    getSubscriptionStatus: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        return {
          status: dealer.subscriptionStatus || 'none',
          expiresAt: dealer.subscriptionExpiresAt,
        };
      }),

    createCustomerPortalSession: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        if (!dealer.stripeCustomerId) {
          throw new Error('No Stripe customer ID found. Please subscribe first.');
        }
        
        // Create Stripe Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
          customer: dealer.stripeCustomerId,
          return_url: `${ctx.req.headers.origin}/dealer/subscription/manage`,
        });
        
        return { portalUrl: session.url };
      }),

    getSubscriptionAnalytics: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        return await db.getSubscriptionAnalytics(dealer.id);
      }),

    // Referral program
    getReferralCode: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        // Generate referral code if doesn't exist
        if (!dealer.referralCode) {
          const code = await db.generateReferralCode(dealer.id);
          return { referralCode: code };
        }
        
        return { referralCode: dealer.referralCode };
      }),

    getReferralStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        return await db.getDealerReferralStats(dealer.id);
      }),

    validateReferralCode: publicProcedure
      .input(z.object({
        code: z.string(),
      }))
      .query(async ({ input }) => {
        const dealer = await db.getDealerByReferralCode(input.code);
        return { valid: !!dealer, dealerName: dealer?.name };
      }),

    // Analytics
    getAnalytics: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        return await db.getDealerAnalytics(dealer.id);
      }),

    getWinStats: protectedProcedure
      .input(z.object({
        dealerId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        let dealerId = input.dealerId;
        
        // If no dealerId provided, get current user's dealer profile
        if (!dealerId) {
          const dealer = await db.getDealerByUserId(ctx.user.id);
          if (!dealer) {
            return null;
          }
          dealerId = dealer.id;
        }
        
        const { getDealerWinStats } = await import('./dealerWinStats');
        return await getDealerWinStats(dealerId);
      }),

    // Dealer marketplace
    getDealerMarketplace: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        // Check subscription status
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        if (dealer.subscriptionStatus !== 'active') {
          throw new Error('Active subscription required to access dealer marketplace');
        }
        
        // Get dealer-only cars
        return await db.getCars({
          ...input,
          marketplace: 'dealer_only',
        });
      }),

    getMarketplaceVehicleDetails: protectedProcedure
      .input(z.object({ carId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const car = await db.getCarById(input.carId);
        if (!car) return null;

        // Get dealer info if available
        let dealerInfo = null;
        if (car.dealerId) {
          dealerInfo = await db.getDealerById(car.dealerId);
        }

        return {
          ...car,
          dealerName: dealerInfo?.name,
          dealerCity: dealerInfo?.city,
        };
      }),

    getShortlistVehicles: protectedProcedure
      .input(z.object({ carIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        if (input.carIds.length === 0) return [];
        
        return await db.getCarsByIds(input.carIds);
      }),

    moveToMarketplace: protectedProcedure
      .input(z.object({
        carId: z.number(),
        marketplace: z.enum(['consumer', 'dealer_only']),
        minimumPrice: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        // Verify car belongs to dealer
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Car not found');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer || car.dealerId !== dealer.id) {
          throw new Error('Unauthorized: You can only move your own vehicles');
        }
        
        // Update marketplace and minimum price if provided
        const updateData: any = {
          marketplace: input.marketplace,
        };
        
        if (input.minimumPrice) {
          updateData.reservePrice = input.minimumPrice.toString();
        }
        
        await db.updateDealerCar(ctx.user.id, input.carId, updateData);
        
        return { success: true };
       }),

    sendToAuction: protectedProcedure
      .input(z.object({
        carId: z.number(),
        reservePrice: z.number(),
        startingBid: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        // Verify car belongs to dealer
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Car not found');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer || car.dealerId !== dealer.id) {
          throw new Error('Unauthorized: You can only send your own vehicles to auction');
        }
        
        // Set auction with 48-hour duration
        const now = new Date();
        const auctionEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
        
        await db.updateDealerCar(ctx.user.id, input.carId, {
          isAuction: true,
          auctionStartDate: now,
          auctionEndDate: auctionEnd,
          reservePrice: input.reservePrice.toString(),
          startingBid: input.startingBid.toString(),
          currentHighestBid: input.startingBid.toString(), // Initialize with starting bid
          marketplace: 'dealer_only', // Auctions are dealer-only
        });
        
        return { success: true, auctionEndDate: auctionEnd };
       }),

    getMyAuctions: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer not found');
        }
        
        return await db.getDealerAuctions(dealer.id);
      }),

    getAuctionStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer not found');
        }
        
        return await db.getDealerAuctionStats(dealer.id);
      }),

    getAuctionBids: protectedProcedure
      .input(z.object({ carId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        // Verify car belongs to dealer
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Car not found');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer || car.dealerId !== dealer.id) {
          throw new Error('Unauthorized: You can only view bids on your own vehicles');
        }
        
        return await db.getAuctionBidHistory(input.carId);
      }),

    cancelAuction: protectedProcedure
      .input(z.object({ carId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        // Verify car belongs to dealer
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Car not found');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer || car.dealerId !== dealer.id) {
          throw new Error('Unauthorized: You can only cancel your own auctions');
        }
        
        // Get all bidders for this auction
        const bidHistory = await db.getAuctionBidHistory(input.carId);
        // Get unique bidder IDs from bid history
        const bidderIds = bidHistory.map(bid => bid.id); // Using bid ID as proxy
        const uniqueBidders = Array.from(new Set(bidderIds));
        
        // TODO: Refund commitment fees to all bidders
        // This would require Stripe refund API integration
        // For now, we log the bidders who need refunds
        console.log(`[Auction Cancelled] Vehicle ID: ${input.carId}, Bidders to refund: ${uniqueBidders.length}`);
        
        // TODO: Send email notifications to all bidders
        // This would use the notification system to alert bidders
        for (const bidId of uniqueBidders) {
          // Log notification intent (actual implementation would fetch dealer info and send emails)
          console.log(`[Notification] Auction cancelled for ${car.make} ${car.model} - Bid ID: ${bidId}`);
          // Future implementation:
          // const bidderInfo = await db.getDealerByBidId(bidId);
          // await notifyDealer(bidderInfo.userId, {
          //   title: 'Auction Cancelled',
          //   content: `The auction for ${car.make} ${car.model} has been cancelled by the seller. Your commitment fee will be refunded within 5-7 business days.`
          // });
        }
        
        // Cancel auction and return vehicle to inventory
        await db.updateDealerCar(ctx.user.id, input.carId, {
          isAuction: false,
          auctionStartDate: null,
          auctionEndDate: null,
        });
        
        return { 
          success: true, 
          biddersNotified: uniqueBidders.length,
          message: `Auction cancelled. ${uniqueBidders.length} bidder(s) will be notified and refunded.`
        };
      }),

    processExpiredAuctions: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const results = await db.processExpiredAuctions();
        return { processed: results.length, results };
      }),

    // Purchase management
    getPurchaseDetails: protectedProcedure
      .input(z.object({ purchaseId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        return await db.getPurchaseDetails(ctx.user.id, input.purchaseId);
      }),

    downloadPurchaseReceipt: protectedProcedure
      .input(z.object({ purchaseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const receipt = await db.generatePurchaseReceipt(ctx.user.id, input.purchaseId);
        return { content: receipt };
      }),

    exportPurchaseHistory: protectedProcedure
      .input(z.object({ format: z.enum(['csv', 'pdf']) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        if (input.format === 'csv') {
          const csv = await db.exportPurchaseHistoryCSV(dealer.id);
          return { content: csv, filename: `purchase-history-${Date.now()}.csv` };
        } else {
          const pdf = await db.exportPurchaseHistoryPDF(dealer.id);
          return { content: pdf, filename: `purchase-history-${Date.now()}.pdf` };
        }
      }),

    // Offer/Negotiation endpoints
    makeOffer: protectedProcedure
      .input(z.object({
        carId: z.number(),
        toDealerId: z.number(),
        offerAmount: z.number(),
        message: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        // Verify car exists and belongs to target dealer
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Car not found');
        }

        if (car.dealerId !== input.toDealerId) {
          throw new Error('Car does not belong to the specified dealer');
        }

        // Create offer
        await db.createDealerOffer({
          carId: input.carId,
          fromDealerId: dealer.id,
          toDealerId: input.toDealerId,
          offerAmount: input.offerAmount,
          message: input.message,
        });

        return { success: true };
      }),

    getMyOffers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        // Get offers made by this dealer and offers received
        return await db.getDealerOffers(dealer.id);
      }),

    respondToOffer: protectedProcedure
      .input(z.object({
        offerId: z.number(),
        action: z.enum(['accept', 'reject', 'counter']),
        counterAmount: z.number().optional(),
        counterMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        await db.respondToDealerOffer({
          offerId: input.offerId,
          dealerId: dealer.id,
          action: input.action,
          counterAmount: input.counterAmount,
          counterMessage: input.counterMessage,
        });

        return { success: true };
      }),

    // Delivery endpoints
    calculateDeliveryCost: protectedProcedure
      .input(z.object({
        carId: z.number(),
        fromPostcode: z.string(),
        toPostcode: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Simple distance-based pricing algorithm
        // In production, integrate with actual haulier API
        const distance = calculatePostcodeDistance(input.fromPostcode, input.toPostcode);
        
        // Base rate: £1.50 per mile, minimum £150
        const baseCost = Math.max(distance * 1.5, 150);
        
        // Add 20% for insurance and handling
        const totalCost = Math.round(baseCost * 1.2);
        
        // Estimate delivery time based on distance
        const estimatedDays = distance < 100 ? 2 : distance < 200 ? 3 : distance < 300 ? 4 : 5;

        return {
          distance,
          cost: totalCost,
          estimatedDays,
        };
      }),

    bookDelivery: protectedProcedure
      .input(z.object({
        carId: z.number(),
        fromPostcode: z.string(),
        toPostcode: z.string(),
        cost: z.number(),
        distance: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        // In production, integrate with haulier booking API
        // For now, just log the booking request
        console.log('[Delivery Booking]', {
          dealerId: dealer.id,
          carId: input.carId,
          from: input.fromPostcode,
          to: input.toPostcode,
          cost: input.cost,
          distance: input.distance,
        });

        // TODO: Send confirmation email to dealer
        // TODO: Notify haulier partner
        // TODO: Create delivery tracking record in database

        return { success: true, bookingId: `DEL-${Date.now()}` };
      }),

    // Cart endpoints
    addToCart: protectedProcedure
      .input(z.object({
        carId: z.number(),
        priceAtAdd: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        await db.addToCart(dealer.id, input.carId, input.priceAtAdd);
        return { success: true };
      }),

    removeFromCart: protectedProcedure
      .input(z.object({ carId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        await db.removeFromCart(dealer.id, input.carId);
        return { success: true };
      }),

    getCart: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        const items = await db.getCartItems(dealer.id);
        const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.priceAtAdd || '0'), 0);
        const discount = await db.calculateBulkDiscount(items.length, totalPrice);
        
        return {
          items,
          totalPrice,
          ...discount,
        };
      }),

    clearCart: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        await db.clearCart(dealer.id);
        return { success: true };
      }),

    // Watchlist endpoints
    addToWatchlist: protectedProcedure
      .input(z.object({
        carId: z.number(),
        initialPrice: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        await db.addToWatchlist(dealer.id, input.carId, input.initialPrice);
        return { success: true };
      }),

    removeFromWatchlist: protectedProcedure
      .input(z.object({ carId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        await db.removeFromWatchlist(dealer.id, input.carId);
        return { success: true };
      }),

    getWatchlist: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        return await db.getWatchlistItems(dealer.id);
      }),

    checkPriceDrops: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }
        
        return await db.checkPriceDrops(dealer.id);
      }),

    getAuctionAnalytics: protectedProcedure
      .input(z.object({
        timeRange: z.enum(['7d', '30d', '90d', 'all']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer not found');
        }
        
        const { getDealerAuctionAnalytics } = await import('./auctionAnalytics');
        return await getDealerAuctionAnalytics(dealer.id, input?.timeRange || '30d');
      }),

    uploadVehicleImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer not found');
        }

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const extension = input.fileName.split('.').pop();
        const fileKey = `dealer-${dealer.id}/vehicles/${timestamp}-${randomSuffix}.${extension}`;

        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, 'base64');

        // Upload to S3
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

        return { url };
      }),

    // EV Faults Database (Premium Feature)
    getFaultsByModel: protectedProcedure
      .input(z.object({
        make: z.string(),
        model: z.string().optional(),
        category: z.string().optional(),
        severity: z.string().optional(),
        searchText: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Check subscription status
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access EV faults database');
        }

        return await db.getEvFaultsByModel(
          input.make, 
          input.model, 
          input.category, 
          input.severity, 
          input.searchText
        );
      }),

    getAllFaultMakes: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Check subscription status
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access EV faults database');
        }

        return await db.getAllFaultMakes();
      }),

    getAllFaultModels: protectedProcedure
      .input(z.object({ make: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Check subscription status
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access EV faults database');
        }

        return await db.getAllFaultModels(input.make);
      }),

    addFaultReport: protectedProcedure
      .input(z.object({
        make: z.string(),
        model: z.string(),
        yearFrom: z.number().optional(),
        yearTo: z.number().optional(),
        problemTitle: z.string(),
        description: z.string(),
        symptoms: z.string(),
        resolution: z.string(),
        category: z.enum([
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
        ]),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        frequency: z.enum(['rare', 'occasional', 'common', 'very_common']),
        estimatedCostMin: z.number().optional(),
        estimatedCostMax: z.number().optional(),
        laborHours: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Check subscription status
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to contribute to EV faults database');
        }

        return await db.addEvFault({
          ...input,
          contributedByDealerId: dealer.id,
          sourceType: 'dealer_contributed' as const,
        });
      }),

    addFaultContribution: protectedProcedure
      .input(z.object({
        faultId: z.number(),
        contributionType: z.enum([
          'additional_solution',
          'cost_update',
          'symptom_clarification',
          'alternative_fix',
          'parts_recommendation'
        ]),
        content: z.string(),
        actualCost: z.number().optional(),
        actualLaborHours: z.number().optional(),
        partsUsed: z.array(z.object({
          partName: z.string(),
          partNumber: z.string().optional(),
          supplier: z.string().optional(),
          cost: z.number().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Check subscription status
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to contribute to EV faults database');
        }

        return await db.addEvFaultContribution({
          ...input,
          dealerId: dealer.id,
        });
      }),

    markFaultHelpful: protectedProcedure
      .input(z.object({ faultId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access EV faults database');
        }

        return await db.markEvFaultHelpful(input.faultId, dealer.id);
      }),

    getFaultContributions: protectedProcedure
      .input(z.object({ faultId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access EV faults database');
        }

        return await db.getEvFaultContributions(input.faultId);
      }),

    rateFault: protectedProcedure
      .input(z.object({
        faultId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to rate faults');
        }

        return await db.addEvFaultRating({
          faultId: input.faultId,
          dealerId: dealer.id,
          rating: input.rating,
          comment: input.comment,
        });
      }),

    getFaultRatings: protectedProcedure
      .input(z.object({ faultId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access EV faults database');
        }

        return await db.getEvFaultRatings(input.faultId);
      }),

    getMyFaultRating: protectedProcedure
      .input(z.object({ faultId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access EV faults database');
        }

        return await db.getDealerFaultRating(input.faultId, dealer.id);
      }),

    getFaultAverageRating: protectedProcedure
      .input(z.object({ faultId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access EV faults database');
        }

        return await db.getEvFaultAverageRating(input.faultId);
      }),

    pushToDealerNetwork: protectedProcedure
      .input(z.object({
        carId: z.number(),
        mode: z.enum(['marketplace', 'auction']),
        minimumPrice: z.number().optional(), // For marketplace
        reservePrice: z.number().optional(), // For auction
        buyNowPrice: z.number().optional(), // For auction
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');  
        }

        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer profile not found');
        }

        // Check subscription status
        if (dealer.subscriptionStatus !== 'active' && ctx.user.role !== 'admin') {
          throw new Error('Active subscription required to access dealer network');
        }

        // Get the car and verify ownership
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('Database connection failed');

        const { cars } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        const car = await dbInstance
          .select()
          .from(cars)
          .where(eq(cars.id, input.carId))
          .limit(1);

        if (!car[0]) {
          throw new Error('Car not found');
        }

        if (car[0].dealerId !== dealer.id) {
          throw new Error('Unauthorized: You can only push your own vehicles');
        }

        // Update car to dealer network
        const updateData: any = {
          marketplace: 'dealer_only' as const,
          updatedAt: new Date(),
        };

        if (input.mode === 'auction') {
          // Set up 48-hour auction
          const now = new Date();
          const endDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

          updateData.isAuction = true;
          updateData.auctionStartDate = now;
          updateData.auctionEndDate = endDate;
          updateData.reservePrice = input.reservePrice?.toString() || car[0].price;
          updateData.buyNowPrice = input.buyNowPrice?.toString() || car[0].price;
          updateData.startingBid = (Number(car[0].price) * 0.7).toFixed(2); // Start at 70% of price
        } else {
          // Marketplace mode
          updateData.isAuction = false;
          if (input.minimumPrice) {
            updateData.price = input.minimumPrice.toString();
          }
        }

        await dbInstance
          .update(cars)
          .set(updateData)
          .where(eq(cars.id, input.carId));

        return { success: true, mode: input.mode };
      }),
  }),

  // Admin router
  admin: router({
    // Dealer management
    getAllDealers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const adminDb = await import('./adminDb');
        return await adminDb.getAllDealers();
      }),

    getDealerById: protectedProcedure
      .input(z.object({
        dealerId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const adminDb = await import('./adminDb');
        return await adminDb.getDealerById(input.dealerId);
      }),

    getDealerCars: protectedProcedure
      .input(z.object({
        dealerId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const adminDb = await import('./adminDb');
        return await adminDb.getDealerCarsAdmin(input.dealerId);
      }),

    impersonate: protectedProcedure
      .input(z.object({
        dealerId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Get dealer info
        const dealer = await db.getDealerById(input.dealerId);
        if (!dealer) {
          throw new Error('Dealer not found');
        }

        // Ensure dealer has a firebaseId (openId)
        if (!dealer.firebaseId) {
          throw new Error(`Dealer "${dealer.name}" does not have a linked user account (firebaseId is missing)`);
        }

        // Get dealer's user info
        const dealerUser = await db.getUserByOpenId(dealer.firebaseId);
        if (!dealerUser) {
          throw new Error(`User account not found for dealer "${dealer.name}" (firebaseId: ${dealer.firebaseId}). The user may have been deleted.`);
        }

        // Create session token using SDK (compatible with auth verification)
        const sessionToken = await sdk.createSessionToken(dealerUser.openId, {
          name: dealerUser.name || dealer.name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        console.log('[Impersonate] Setting cookie with options:', cookieOptions);
        console.log('[Impersonate] Session token:', sessionToken.substring(0, 20) + '...');
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        console.log('[Impersonate] Cookie set for dealer:', dealer.name, 'openId:', dealerUser.openId);

        return { success: true, dealerName: dealer.name };
      }),

    exitImpersonation: protectedProcedure
      .mutation(async ({ ctx }) => {
        // For now, just clear the session and redirect to login
        // User will need to log in again as admin
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

        return { success: true };
      }),

    // Dealer applications
    getApplications: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        return await db.getDealerApplications(input);
      }),

    approveApplication: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Get application
        const applications = await db.getDealerApplications();
        const application = applications.find(app => app.id === input.applicationId);
        
        if (!application) {
          throw new Error('Application not found');
        }
        
        if (application.status !== 'pending') {
          throw new Error('Application has already been processed');
        }
        
        if (!application.userId) {
          throw new Error('Application has no associated user');
        }
        
        // Create dealer account
        await db.createDealer(application.userId, {
          businessName: application.businessName,
          contactName: application.contactName,
          email: application.email,
          phone: application.phone,
          address: application.address,
          description: application.description,
          verified: true,
        });
        
        // Update user role to dealer
        await db.updateUserRole(application.userId, 'dealer');
        
        // Update application status
        await db.updateApplicationStatus(input.applicationId, 'approved');
        
        return { success: true };
      }),

    rejectApplication: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        await db.updateApplicationStatus(input.applicationId, 'rejected');
        
        return { success: true };
      }),
  }),

  // Test Drive Bookings router
  testDrive: router({
    create: protectedProcedure
      .input(z.object({
        carId: z.number(),
        dealerId: z.number(),
        preferredDate: z.string(),
        preferredTime: z.string(),
        customerName: z.string(),
        customerEmail: z.string(),
        customerPhone: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const bookingDate = new Date(input.preferredDate);
        
        // Check if time slot is available
        const isAvailable = await db.checkTestDriveAvailability(
          input.dealerId,
          bookingDate,
          input.preferredTime
        );
        
        if (!isAvailable) {
          throw new Error('This time slot is already booked. Please select a different time.');
        }
        
        await db.createTestDriveBooking({
          userId: ctx.user.id,
          carId: input.carId,
          dealerId: input.dealerId,
          preferredDate: bookingDate,
          preferredTime: input.preferredTime,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          notes: input.notes || null,
          status: "pending",
        });
        
        return { success: true };
      }),

    getDealerBookings: protectedProcedure
      .query(async ({ ctx }) => {
        // Get dealer ID for current user
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Not a dealer');
        }
        
        return await db.getDealerTestDriveBookings(dealer.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify dealer owns this booking
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Not a dealer');
        }
        
        await db.updateTestDriveBookingStatus(input.bookingId, input.status);
        
        return { success: true };
      }),

    getBookedSlots: publicProcedure
      .input(z.object({
        dealerId: z.number(),
        date: z.string(), // Format: YYYY-MM-DD
      }))
      .query(async ({ input }) => {
        return await db.getBookedTimeSlots(input.dealerId, new Date(input.date));
      }),
  }),

  // Dealer Auction router
  auction: router({
    getActiveVehicles: publicProcedure
      .query(async () => {
        return await db.getActiveAuctionVehicles();
      }),

    placeBid: protectedProcedure
      .input(z.object({
        carId: z.number(),
        bidAmount: z.number(),
        message: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get dealer ID for current user
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Only dealers can place bids');
        }

        // Check if dealer has active subscription
        if (dealer.subscriptionStatus !== 'active') {
          throw new Error('Active subscription required to place bids');
        }

        // Get the car to validate bid
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Vehicle not found');
        }

        if (!car.isAuction) {
          throw new Error('This vehicle is not in auction');
        }

        // Check if auction is still active
        const now = new Date();
        if (car.auctionEndDate && new Date(car.auctionEndDate) < now) {
          throw new Error('Auction has ended');
        }

        // Validate bid amount
        const currentBid = car.currentHighestBid ? parseFloat(car.currentHighestBid.toString()) : parseFloat(car.startingBid?.toString() || '0');
        if (input.bidAmount <= currentBid) {
          throw new Error(`Bid must be higher than current bid of £${currentBid.toLocaleString()}`);
        }

        // Check reserve price if set
        if (car.reservePrice) {
          const reservePrice = parseFloat(car.reservePrice.toString());
          if (input.bidAmount < reservePrice) {
            throw new Error(`Bid must meet or exceed reserve price of £${reservePrice.toLocaleString()}`);
          }
        }

        // Check if bid is placed in final 2 minutes - extend auction by 5 minutes
        let extended = false;
        let newEndDate = car.auctionEndDate;
        if (car.auctionEndDate) {
          const endDate = new Date(car.auctionEndDate);
          const timeRemaining = endDate.getTime() - now.getTime();
          const twoMinutesInMs = 2 * 60 * 1000;
          
          if (timeRemaining <= twoMinutesInMs && timeRemaining > 0) {
            // Extend auction by 5 minutes
            newEndDate = new Date(endDate.getTime() + 5 * 60 * 1000);
            await db.updateDealerCar(ctx.user.id, input.carId, {
              auctionEndDate: newEndDate,
            });
            extended = true;
          }
        }

        // Place the bid
        await db.placeBid({
          carId: input.carId,
          dealerId: dealer.id,
          userId: ctx.user.id,
          bidAmount: input.bidAmount.toString(),
          message: input.message || null,
          status: 'winning',
        });

        // Process proxy bids (automatic counter-bidding)
        try {
          const { processProxyBids } = await import('./proxyBidding');
          await processProxyBids(input.carId, input.bidAmount, dealer.id);
        } catch (error) {
          console.error('[Auction] Error processing proxy bids:', error);
          // Don't throw - proxy bid failure shouldn't break manual bidding
        }

        return { success: true, extended, newEndDate };
      }),

    getBidHistory: publicProcedure
      .input(z.object({
        carId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getVehicleBidHistory(input.carId);
      }),

    getMyBids: protectedProcedure
      .query(async ({ ctx }) => {
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          return [];
        }
        return await db.getDealerBids(dealer.id);
      }),

    startAuction: protectedProcedure
      .input(z.object({
        carId: z.number(),
        startingBid: z.number(),
        reservePrice: z.number(),
        durationDays: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user owns this vehicle
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Only dealers can start auctions');
        }

        const car = await db.getCarById(input.carId);
        if (!car || car.dealerId !== dealer.id) {
          throw new Error('Vehicle not found or not owned by you');
        }

        await db.startAuction(
          input.carId,
          input.startingBid,
          input.reservePrice,
          input.durationDays || 7
        );

        return { success: true };
      }),

    buyNow: protectedProcedure
      .input(z.object({
        carId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get dealer ID for current user
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Only dealers can purchase vehicles');
        }

        // Check if dealer has active subscription
        if (dealer.subscriptionStatus !== 'active') {
          throw new Error('Active subscription required to purchase');
        }

        // Get the car to validate purchase
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Vehicle not found');
        }

        if (!car.isAuction) {
          throw new Error('This vehicle is not in auction');
        }

        if (!car.buyNowPrice) {
          throw new Error('Buy Now is not available for this vehicle');
        }

        // Check if auction is still active
        const now = new Date();
        if (car.auctionEndDate && new Date(car.auctionEndDate) < now) {
          throw new Error('Auction has ended');
        }

        // Process instant purchase
        const buyNowPrice = parseFloat(car.buyNowPrice.toString());
        
        // Check reserve price if set
        if (car.reservePrice) {
          const reservePrice = parseFloat(car.reservePrice.toString());
          if (buyNowPrice < reservePrice) {
            throw new Error('Buy Now price does not meet reserve price');
          }
        }
        // Process Buy Now - remove from auction and create winning bid record
        await db.buyNowAuction(input.carId, dealer.id, ctx.user.id, buyNowPrice);

        // Get seller information
        const seller = await db.getDealerById(car.dealerId!);
        
        // Create Stripe checkout session for £99 commitment fee
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const commitmentFee = 99;
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: `Buy Now Commitment Fee: ${car.make} ${car.model} ${car.year}`,
                  description: `Non-refundable £99 commitment fee. Purchase price: £${buyNowPrice.toLocaleString()}. Balance due after inspection. VIN: ${car.vin || 'N/A'}`,
                  images: car.mainImage ? [car.mainImage] : undefined,
                },
                unit_amount: commitmentFee * 100, // £99 in pence
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${ctx.req.headers.origin}/dealer/my-wins?payment=success`,
          cancel_url: `${ctx.req.headers.origin}/dealer/auction?payment=cancelled`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            dealer_id: dealer.id.toString(),
            car_id: input.carId.toString(),
            purchase_type: 'buy_now',
            purchase_price: buyNowPrice.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || dealer.name,
          },
        });
        
        // Send notification to buyer
        await notifyOwner({
          title: `Purchase Confirmed: ${car.make} ${car.model}`,
          content: `Congratulations! You have successfully purchased ${car.make} ${car.model} ${car.year} for £${buyNowPrice.toLocaleString()} via Buy Now.\n\nNext step: Complete £99 commitment fee payment.\n\nSeller: ${seller?.name || 'Unknown'}\nContact: ${seller?.email || 'N/A'}\n\nBalance due after inspection: £${(buyNowPrice - 99).toLocaleString()}`,
        });
        
        // Send notification to seller
        if (seller) {
          await notifyOwner({
            title: `Vehicle Sold: ${car.make} ${car.model}`,
            content: `Your vehicle ${car.make} ${car.model} ${car.year} has been sold via Buy Now for £${buyNowPrice.toLocaleString()}.\n\nBuyer: ${dealer.name}\nContact: ${dealer.email || 'N/A'}\n\nPlease arrange delivery or pickup with the buyer.`,
          });
        }

        return { success: true, price: buyNowPrice, checkoutUrl: session.url };
      }),

    setProxyBid: protectedProcedure
      .input(z.object({
        carId: z.number(),
        maxBidAmount: z.number(),
        incrementAmount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Only dealers can set proxy bids');
        }

        if (dealer.subscriptionStatus !== 'active') {
          throw new Error('Active subscription required to use proxy bidding');
        }

        // Get current highest bid to set initial current bid amount
        const car = await db.getCarById(input.carId);
        if (!car) {
          throw new Error('Vehicle not found');
        }

        const currentBid = car.currentHighestBid ? parseFloat(car.currentHighestBid.toString()) : parseFloat(car.startingBid?.toString() || '0');
        const increment = input.incrementAmount || 100;

        if (input.maxBidAmount <= currentBid) {
          throw new Error(`Maximum bid must be higher than current bid of £${currentBid.toLocaleString()}`);
        }

        const { setProxyBid } = await import('./proxyBidding');
        await setProxyBid({
          carId: input.carId,
          dealerId: dealer.id,
          userId: ctx.user.id,
          maxBidAmount: input.maxBidAmount.toString(),
          currentBidAmount: currentBid.toString(),
          incrementAmount: increment.toString(),
          isActive: true,
        });

        return { success: true };
      }),

    cancelProxyBid: protectedProcedure
      .input(z.object({
        proxyBidId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer not found');
        }

        const { cancelProxyBid } = await import('./proxyBidding');
        await cancelProxyBid(input.proxyBidId, dealer.id);

        return { success: true };
      }),

    getMyProxyBids: protectedProcedure
      .query(async ({ ctx }) => {
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          return [];
        }

        const { getDealerProxyBids } = await import('./proxyBidding');
        return await getDealerProxyBids(dealer.id);
      }),

    getProxyBid: protectedProcedure
      .input(z.object({
        carId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          return null;
        }

        const { getProxyBid } = await import('./proxyBidding');
        return await getProxyBid(input.carId, dealer.id);
      }),

    createWinPaymentCheckout: protectedProcedure
      .input(z.object({
        bidId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer not found');
        }

        // Get bid details
        const bids = await db.getDealerBids(dealer.id);
        const bid = bids.find((b: any) => b.id === input.bidId && b.status === 'won');
        
        if (!bid) {
          throw new Error('Winning bid not found');
        }

        const car = bid.car;
        if (!car) {
          throw new Error('Vehicle not found');
        }

        const winningBid = parseFloat(bid.bid.bidAmount);
        const commitmentFee = 99; // £99 non-refundable commitment fee
        
        // Create Stripe checkout session for auction win commitment fee
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: `Auction Commitment Fee: ${car.make} ${car.model} ${car.year}`,
                  description: `Non-refundable £99 commitment fee. Winning bid: £${winningBid.toLocaleString()}. Balance due after inspection. VIN: ${car.vin || 'N/A'}`,
                  images: car.mainImage ? [car.mainImage] : undefined,
                },
                unit_amount: commitmentFee * 100, // £99 in pence
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${ctx.req.headers.origin}/dealer/my-wins?payment=success`,
          cancel_url: `${ctx.req.headers.origin}/dealer/my-wins?payment=cancelled`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            dealer_id: dealer.id.toString(),
            bidId: input.bidId.toString(), // Used by webhook to update payment status
            car_id: car.id.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || dealer.name,
            payment_type: 'auction_win',
          },
          allow_promotion_codes: true,
        });

        return { checkoutUrl: session.url };
      }),

    scheduleInspection: protectedProcedure
      .input(z.object({
        bidId: z.number(),
        scheduledAt: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealer = await db.getDealerByUserId(ctx.user.id);
        if (!dealer) {
          throw new Error('Dealer not found');
        }

        // Verify bid belongs to this dealer
        const bids = await db.getDealerBids(dealer.id);
        const bid = bids.find((b: any) => b.bid.id === input.bidId);
        
        if (!bid) {
          throw new Error('Bid not found');
        }

        // Update inspection schedule
        await db.updateBidInspectionSchedule(input.bidId, {
          inspectionScheduledAt: new Date(input.scheduledAt),
          inspectionNotes: input.notes || null,
        });

        return { success: true };
      }),

    shareShortlist: protectedProcedure
      .input(z.object({
        carIds: z.array(z.number()),
        recipientEmail: z.string().email(),
        message: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'dealer' && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Dealer access required');
        }

        // Get vehicle details
        const vehicles = await db.getCarsByIds(input.carIds);
        
        // Build email content
        const vehicleList = vehicles.map(v => 
          `• ${v.year} ${v.make} ${v.model} - £${v.price?.toLocaleString()} (${v.mileage?.toLocaleString()} miles)`
        ).join('\n');

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #86efac 0%, #4ade80 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .vehicle-card { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #4ade80; }
              .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
              .message-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚗 Shared Vehicle Shortlist</h1>
              </div>
              <div class="content">
                <p>${ctx.user.name || 'A colleague'} has shared a vehicle shortlist with you:</p>
                
                ${input.message ? `
                  <div class="message-box">
                    <strong>Message:</strong><br>
                    ${input.message}
                  </div>
                ` : ''}

                <h3 style="margin-top: 20px;">Vehicles (${vehicles.length}):</h3>
                
                ${vehicles.map(v => `
                  <div class="vehicle-card">
                    <h4 style="margin: 0 0 10px 0;">${v.year} ${v.make} ${v.model}</h4>
                    <p style="margin: 5px 0; color: #666;">
                      ${v.mileage?.toLocaleString()} miles • ${v.condition}
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #16a34a;">
                      £${v.price?.toLocaleString()}
                    </p>
                    <a href="${process.env.VITE_APP_URL || 'https://eveevo.com'}/dealer/marketplace/${v.id}" class="button">
                      View Details
                    </a>
                  </div>
                `).join('')}

                <div class="footer">
                  <p>EVEEVO - Smart, Easy, Electric EVs</p>
                  <p>Dealer-to-Dealer Marketplace</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email
        const { sendEmail } = await import('./email');
        await sendEmail({
          to: input.recipientEmail,
          subject: `${ctx.user.name || 'A colleague'} shared ${vehicles.length} vehicles with you`,
          html: htmlContent,
        });

        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
