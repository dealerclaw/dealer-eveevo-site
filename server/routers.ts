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

    moveToMarketplace: protectedProcedure
      .input(z.object({
        carId: z.number(),
        marketplace: z.enum(['consumer', 'dealer_only']),
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
        
        // Update marketplace
        await db.updateDealerCar(ctx.user.id, input.carId, {
          marketplace: input.marketplace,
        });
        
        return { success: true };
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

        // Place the bid
        await db.placeBid({
          carId: input.carId,
          dealerId: dealer.id,
          userId: ctx.user.id,
          bidAmount: input.bidAmount.toString(),
          message: input.message || null,
          status: 'winning',
        });

        return { success: true };
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
        await db.buyNowAuction(input.carId, dealer.id, ctx.user.id, buyNowPrice);

        // Get seller information
        const seller = await db.getDealerById(car.dealerId!);
        
        // Send notification to buyer
        await notifyOwner({
          title: `Purchase Confirmed: ${car.make} ${car.model}`,
          content: `Congratulations! You have successfully purchased ${car.make} ${car.model} ${car.year} for £${buyNowPrice.toLocaleString()} via Buy Now.\n\nSeller: ${seller?.name || 'Unknown'}\nContact: ${seller?.email || 'N/A'}\n\nPlease contact the seller to arrange delivery or pickup.`,
        });
        
        // Send notification to seller
        if (seller) {
          await notifyOwner({
            title: `Vehicle Sold: ${car.make} ${car.model}`,
            content: `Your vehicle ${car.make} ${car.model} ${car.year} has been sold via Buy Now for £${buyNowPrice.toLocaleString()}.\n\nBuyer: ${dealer.name}\nContact: ${dealer.email || 'N/A'}\n\nPlease arrange delivery or pickup with the buyer.`,
          });
        }

        return { success: true, price: buyNowPrice };
      }),
  }),
});
export type AppRouter = typeof appRouter;
