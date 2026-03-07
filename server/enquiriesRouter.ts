/**
 * Dealer Enquiries Router
 * Handles B2B marketplace contact/enquiry messages between dealers.
 * A buying dealer can send an enquiry about a listed vehicle; the selling
 * dealer receives an in-app notification and can reply in a threaded view.
 */
import { z } from "zod";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  dealerEnquiries,
  dealerEnquiryReplies,
  dealers,
  cars,
  users,
} from "../drizzle/schema";
import { sendEmail } from "./email";
import { notifyOwner } from "./_core/notification";

// ---------------------------------------------------------------------------
// Helper: resolve the dealer record for the currently authenticated user
// ---------------------------------------------------------------------------
async function getDealerForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select({ id: dealers.id, name: dealers.name, email: dealers.email })
    .from(dealers)
    .where(eq(dealers.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export const enquiriesRouter = router({
  // -------------------------------------------------------------------------
  // Send a new enquiry about a marketplace listing
  // -------------------------------------------------------------------------
  send: protectedProcedure
    .input(
      z.object({
        carId: z.number(),
        message: z.string().min(10, "Message must be at least 10 characters"),
        offerPrice: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Resolve the sending dealer
      const senderDealer = await getDealerForUser(ctx.user.id);
      if (!senderDealer) {
        throw new Error("You must have a dealer profile to send enquiries");
      }

      // Look up the car and its owning dealer
      const carRows = await db
        .select({
          id: cars.id,
          make: cars.make,
          model: cars.model,
          year: cars.year,
          price: cars.price,
          dealerId: cars.dealerId,
        })
        .from(cars)
        .where(eq(cars.id, input.carId))
        .limit(1);

      if (!carRows.length) throw new Error("Car not found");
      const car = carRows[0];

      if (!car.dealerId) throw new Error("This listing has no associated dealer");
      if (car.dealerId === senderDealer.id) {
        throw new Error("You cannot enquire about your own listing");
      }

      // Look up the receiving dealer's email for notification
      const receiverRows = await db
        .select({ id: dealers.id, name: dealers.name, email: dealers.email })
        .from(dealers)
        .where(eq(dealers.id, car.dealerId))
        .limit(1);

      if (!receiverRows.length) throw new Error("Selling dealer not found");
      const receiverDealer = receiverRows[0];

      // Insert the enquiry
      await db.insert(dealerEnquiries).values({
        carId: input.carId,
        senderDealerId: senderDealer.id,
        receiverDealerId: receiverDealer.id,
        message: input.message,
        offerPrice: input.offerPrice ? String(input.offerPrice) : null,
        status: "pending",
        isReadByReceiver: false,
      });

      // Notify the receiving dealer by email (non-blocking)
      if (receiverDealer.email) {
        const carLabel = `${car.year ?? ""} ${car.make} ${car.model}`.trim();
        const offerLine = input.offerPrice
          ? `<p><strong>Offer price:</strong> £${input.offerPrice.toLocaleString()}</p>`
          : "";
        const html = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#16a34a">New Enquiry on ${carLabel}</h2>
            <p>You have received a new dealer enquiry from <strong>${senderDealer.name}</strong>.</p>
            ${offerLine}
            <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0;white-space:pre-wrap">${input.message}</p>
            </div>
            <a href="https://dealer.eveevo.co.uk/dealer/inbox"
               style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
              View in Inbox
            </a>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">EVEEVO Dealer Marketplace</p>
          </div>
        `;
        sendEmail({
          to: receiverDealer.email,
          subject: `New enquiry on your ${carLabel} listing`,
          html,
        }).catch((err) => console.error("[Enquiry] Email send failed:", err));
      }

      // Notify the platform owner for monitoring
      notifyOwner({
        title: "New Dealer Enquiry",
        content: `${senderDealer.name} enquired about car #${input.carId} (${car.make} ${car.model}) from ${receiverDealer.name}`,
      }).catch(() => {});

      return { success: true };
    }),

  // -------------------------------------------------------------------------
  // List enquiries for the current dealer (inbox = received, sent = outbox)
  // -------------------------------------------------------------------------
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(["inbox", "sent"]).default("inbox"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { enquiries: [] };

      const dealer = await getDealerForUser(ctx.user.id);
      if (!dealer) return { enquiries: [] };

      const condition =
        input.type === "inbox"
          ? eq(dealerEnquiries.receiverDealerId, dealer.id)
          : eq(dealerEnquiries.senderDealerId, dealer.id);

      const rows = await db
        .select({
          id: dealerEnquiries.id,
          carId: dealerEnquiries.carId,
          senderDealerId: dealerEnquiries.senderDealerId,
          receiverDealerId: dealerEnquiries.receiverDealerId,
          message: dealerEnquiries.message,
          offerPrice: dealerEnquiries.offerPrice,
          status: dealerEnquiries.status,
          isReadByReceiver: dealerEnquiries.isReadByReceiver,
          createdAt: dealerEnquiries.createdAt,
          updatedAt: dealerEnquiries.updatedAt,
          // Car info
          carMake: cars.make,
          carModel: cars.model,
          carYear: cars.year,
          carMainImage: cars.mainImage,
          // Sender dealer info
          senderName: sql<string>`senderDealer.name`,
          senderLogoUrl: sql<string>`senderDealer.logoUrl`,
          // Receiver dealer info
          receiverName: sql<string>`receiverDealer.name`,
          receiverLogoUrl: sql<string>`receiverDealer.logoUrl`,
        })
        .from(dealerEnquiries)
        .innerJoin(cars, eq(dealerEnquiries.carId, cars.id))
        .innerJoin(
          sql`dealers AS senderDealer`,
          sql`senderDealer.id = ${dealerEnquiries.senderDealerId}`
        )
        .innerJoin(
          sql`dealers AS receiverDealer`,
          sql`receiverDealer.id = ${dealerEnquiries.receiverDealerId}`
        )
        .where(condition)
        .orderBy(desc(dealerEnquiries.updatedAt));

      return { enquiries: rows };
    }),

  // -------------------------------------------------------------------------
  // Get a single enquiry with its full reply thread
  // -------------------------------------------------------------------------
  getThread: protectedProcedure
    .input(z.object({ enquiryId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const dealer = await getDealerForUser(ctx.user.id);
      if (!dealer) throw new Error("Dealer profile not found");

      // Fetch the enquiry
      const enquiryRows = await db
        .select({
          id: dealerEnquiries.id,
          carId: dealerEnquiries.carId,
          senderDealerId: dealerEnquiries.senderDealerId,
          receiverDealerId: dealerEnquiries.receiverDealerId,
          message: dealerEnquiries.message,
          offerPrice: dealerEnquiries.offerPrice,
          status: dealerEnquiries.status,
          isReadByReceiver: dealerEnquiries.isReadByReceiver,
          createdAt: dealerEnquiries.createdAt,
          updatedAt: dealerEnquiries.updatedAt,
          carMake: cars.make,
          carModel: cars.model,
          carYear: cars.year,
          carPrice: cars.price,
          carMainImage: cars.mainImage,
          senderName: sql<string>`senderDealer.name`,
          senderLogoUrl: sql<string>`senderDealer.logoUrl`,
          receiverName: sql<string>`receiverDealer.name`,
          receiverLogoUrl: sql<string>`receiverDealer.logoUrl`,
        })
        .from(dealerEnquiries)
        .innerJoin(cars, eq(dealerEnquiries.carId, cars.id))
        .innerJoin(
          sql`dealers AS senderDealer`,
          sql`senderDealer.id = ${dealerEnquiries.senderDealerId}`
        )
        .innerJoin(
          sql`dealers AS receiverDealer`,
          sql`receiverDealer.id = ${dealerEnquiries.receiverDealerId}`
        )
        .where(eq(dealerEnquiries.id, input.enquiryId))
        .limit(1);

      if (!enquiryRows.length) throw new Error("Enquiry not found");
      const enquiry = enquiryRows[0];

      // Verify the current dealer is a participant
      if (
        enquiry.senderDealerId !== dealer.id &&
        enquiry.receiverDealerId !== dealer.id
      ) {
        throw new Error("Access denied");
      }

      // Mark as read if this dealer is the receiver
      if (enquiry.receiverDealerId === dealer.id && !enquiry.isReadByReceiver) {
        await db
          .update(dealerEnquiries)
          .set({ isReadByReceiver: true })
          .where(eq(dealerEnquiries.id, input.enquiryId));
      }

      // Fetch replies
      const replies = await db
        .select({
          id: dealerEnquiryReplies.id,
          enquiryId: dealerEnquiryReplies.enquiryId,
          senderDealerId: dealerEnquiryReplies.senderDealerId,
          message: dealerEnquiryReplies.message,
          createdAt: dealerEnquiryReplies.createdAt,
          senderName: sql<string>`replyDealer.name`,
          senderLogoUrl: sql<string>`replyDealer.logoUrl`,
        })
        .from(dealerEnquiryReplies)
        .innerJoin(
          sql`dealers AS replyDealer`,
          sql`replyDealer.id = ${dealerEnquiryReplies.senderDealerId}`
        )
        .where(eq(dealerEnquiryReplies.enquiryId, input.enquiryId))
        .orderBy(dealerEnquiryReplies.createdAt);

      return { enquiry, replies };
    }),

  // -------------------------------------------------------------------------
  // Reply to an existing enquiry
  // -------------------------------------------------------------------------
  reply: protectedProcedure
    .input(
      z.object({
        enquiryId: z.number(),
        message: z.string().min(1, "Reply cannot be empty"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const dealer = await getDealerForUser(ctx.user.id);
      if (!dealer) throw new Error("Dealer profile not found");

      // Verify the enquiry exists and the dealer is a participant
      const enquiryRows = await db
        .select({
          id: dealerEnquiries.id,
          senderDealerId: dealerEnquiries.senderDealerId,
          receiverDealerId: dealerEnquiries.receiverDealerId,
          carId: dealerEnquiries.carId,
        })
        .from(dealerEnquiries)
        .where(eq(dealerEnquiries.id, input.enquiryId))
        .limit(1);

      if (!enquiryRows.length) throw new Error("Enquiry not found");
      const enquiry = enquiryRows[0];

      if (
        enquiry.senderDealerId !== dealer.id &&
        enquiry.receiverDealerId !== dealer.id
      ) {
        throw new Error("Access denied");
      }

      // Insert the reply
      await db.insert(dealerEnquiryReplies).values({
        enquiryId: input.enquiryId,
        senderDealerId: dealer.id,
        message: input.message,
      });

      // Update the enquiry's updatedAt and status
      await db
        .update(dealerEnquiries)
        .set({ status: "replied", updatedAt: new Date() })
        .where(eq(dealerEnquiries.id, input.enquiryId));

      // Notify the other party by email (non-blocking)
      const otherDealerId =
        enquiry.senderDealerId === dealer.id
          ? enquiry.receiverDealerId
          : enquiry.senderDealerId;

      const otherDealerRows = await db
        .select({ email: dealers.email, name: dealers.name })
        .from(dealers)
        .where(eq(dealers.id, otherDealerId))
        .limit(1);

      if (otherDealerRows.length && otherDealerRows[0].email) {
        const html = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#16a34a">New Reply from ${dealer.name}</h2>
            <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0;white-space:pre-wrap">${input.message}</p>
            </div>
            <a href="https://dealer.eveevo.co.uk/dealer/inbox/${input.enquiryId}"
               style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
              View Conversation
            </a>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">EVEEVO Dealer Marketplace</p>
          </div>
        `;
        sendEmail({
          to: otherDealerRows[0].email,
          subject: `${dealer.name} replied to your enquiry`,
          html,
        }).catch((err) => console.error("[Enquiry] Reply email failed:", err));
      }

      return { success: true };
    }),

  // -------------------------------------------------------------------------
  // Get unread inbox count (for badge in sidebar)
  // -------------------------------------------------------------------------
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };

    const dealer = await getDealerForUser(ctx.user.id);
    if (!dealer) return { count: 0 };

    const rows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(dealerEnquiries)
      .where(
        and(
          eq(dealerEnquiries.receiverDealerId, dealer.id),
          eq(dealerEnquiries.isReadByReceiver, false)
        )
      );

    return { count: Number(rows[0]?.count ?? 0) };
  }),

  // -------------------------------------------------------------------------
  // Close an enquiry (mark as resolved)
  // -------------------------------------------------------------------------
  close: protectedProcedure
    .input(z.object({ enquiryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const dealer = await getDealerForUser(ctx.user.id);
      if (!dealer) throw new Error("Dealer profile not found");

      const enquiryRows = await db
        .select({
          senderDealerId: dealerEnquiries.senderDealerId,
          receiverDealerId: dealerEnquiries.receiverDealerId,
        })
        .from(dealerEnquiries)
        .where(eq(dealerEnquiries.id, input.enquiryId))
        .limit(1);

      if (!enquiryRows.length) throw new Error("Enquiry not found");
      const enquiry = enquiryRows[0];

      if (
        enquiry.senderDealerId !== dealer.id &&
        enquiry.receiverDealerId !== dealer.id
      ) {
        throw new Error("Access denied");
      }

      await db
        .update(dealerEnquiries)
        .set({ status: "closed" })
        .where(eq(dealerEnquiries.id, input.enquiryId));

      return { success: true };
    }),
});
