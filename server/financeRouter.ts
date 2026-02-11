import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { lookupAddressByPostcode } from "./_core/addressLookup";
import { submitFinanceCheck } from "./_core/evolutionFunding";

export const financeRouter = router({
  // Address lookup by postcode
  lookupAddress: publicProcedure
    .input(z.object({
      postcode: z.string(),
    }))
    .query(async ({ input }) => {
      return await lookupAddressByPostcode(input.postcode);
    }),

  // Submit finance credit check
  submitCreditCheck: protectedProcedure
    .input(z.object({
      carId: z.number().optional(),
      vehiclePrice: z.number().optional(),
      deposit: z.number().optional(),
      term: z.number().optional(),
      
      // Personal details
      title: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      dateOfBirth: z.string(), // DD/MM/YYYY
      email: z.string().email(),
      mobileNumber: z.string(),
      
      // Address
      accommodationType: z.string(),
      timeAtPropertyYears: z.number(),
      timeAtPropertyMonths: z.number(),
      address: z.string(),
      postcode: z.string(),
      
      // Driving license
      licenceType: z.string(),
      
      // Personal info
      maritalStatus: z.string(),
      
      // Employment
      employmentStatus: z.string(),
      areaOfEmployment: z.string(),
      annualGrossIncome: z.number(),
      employerName: z.string(),
      employerTownCity: z.string(),
      timeAtEmployerYears: z.number(),
      timeAtEmployerMonths: z.number(),
      
      // Affordability
      affordabilityConfirmed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Submit to Evolution Funding API
      const result = await submitFinanceCheck({
        title: input.title,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        email: input.email,
        mobileNumber: input.mobileNumber,
        accommodationType: input.accommodationType,
        timeAtProperty: {
          years: input.timeAtPropertyYears,
          months: input.timeAtPropertyMonths,
        },
        address: input.address,
        postcode: input.postcode,
        licenceType: input.licenceType,
        maritalStatus: input.maritalStatus,
        employmentStatus: input.employmentStatus,
        areaOfEmployment: input.areaOfEmployment,
        annualGrossIncome: input.annualGrossIncome,
        employerName: input.employerName,
        employerTownCity: input.employerTownCity,
        timeAtEmployer: {
          years: input.timeAtEmployerYears,
          months: input.timeAtEmployerMonths,
        },
        affordabilityConfirmed: input.affordabilityConfirmed,
        vehiclePrice: input.vehiclePrice,
        deposit: input.deposit,
        term: input.term,
      });

      // Save to database
      const applicationId = await db.createFinanceApplication({
        userId: ctx.user.id,
        carId: input.carId,
        loanAmount: input.vehiclePrice ? input.vehiclePrice - (input.deposit || 0) : undefined,
        depositAmount: input.deposit,
        term: input.term,
        applicantData: {
          title: input.title,
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          email: input.email,
          mobileNumber: input.mobileNumber,
          accommodationType: input.accommodationType,
          timeAtPropertyYears: input.timeAtPropertyYears,
          timeAtPropertyMonths: input.timeAtPropertyMonths,
          address: input.address,
          postcode: input.postcode,
          licenceType: input.licenceType,
          maritalStatus: input.maritalStatus,
          employmentStatus: input.employmentStatus,
          areaOfEmployment: input.areaOfEmployment,
          annualGrossIncome: input.annualGrossIncome,
          employerName: input.employerName,
          employerTownCity: input.employerTownCity,
          timeAtEmployerYears: input.timeAtEmployerYears,
          timeAtEmployerMonths: input.timeAtEmployerMonths,
          affordabilityConfirmed: input.affordabilityConfirmed,
        },
        externalApplicationId: result.applicationReference,
        responseData: result,
        status: result.success ? 'submitted' : 'draft',
      });

      return {
        ...result,
        applicationId,
      };
    }),

  // Get user's finance applications
  getMyApplications: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.getUserFinanceApplications(ctx.user.id);
    }),

  // Get single application by ID
  getApplication: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const apps = await db.getUserFinanceApplications(ctx.user.id);
      const app = apps.find(a => a.id === input.id);
      if (!app || app.userId !== ctx.user.id) {
        throw new Error('Application not found');
      }
      return app;
    }),
});
