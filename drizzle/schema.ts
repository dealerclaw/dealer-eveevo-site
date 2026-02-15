import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "dealer"]).default("user").notNull(),
  accountType: mysqlEnum("accountType", ["individual", "business"]).default("individual"),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Dealers table
 */
export const dealers = mysqlTable("dealers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  firebaseId: varchar("firebaseId", { length: 128 }),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postcode: varchar("postcode", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  whatsappNumber: varchar("whatsappNumber", { length: 20 }),
  website: varchar("website", { length: 500 }),
  logoUrl: varchar("logoUrl", { length: 500 }),
  profileUrl: varchar("profileUrl", { length: 500 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: int("reviewCount").default(0),
  businessHours: text("businessHours"), // JSON string: {"monday": "9:00-17:00", ...}
  isVerified: boolean("isVerified").default(false),
  
  // Dealer-to-Dealer subscription
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["none", "active", "expired"]).default("none"),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  
  // Referral program
  referralCode: varchar("referralCode", { length: 20 }).unique(),
  referredBy: int("referredBy"),
  referralCredits: decimal("referralCredits", { precision: 10, scale: 2 }).default("0"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Cars table - synced from Firebase and OneAuto API
 */
export const cars = mysqlTable("cars", {
  id: int("id").autoincrement().primaryKey(),
  firebaseId: varchar("firebaseId", { length: 128 }).unique(),
  dealerId: int("dealerId").references(() => dealers.id),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year"),
  price: decimal("price", { precision: 10, scale: 2 }),
  retailPrice: decimal("retailPrice", { precision: 10, scale: 2 }), // Retail/market price for reference
  mileage: int("mileage"),
  condition: mysqlEnum("condition", ["new", "used"]).default("used"),
  bodyType: varchar("bodyType", { length: 50 }),
  color: varchar("color", { length: 50 }),
  fuelType: varchar("fuelType", { length: 50 }),
  transmission: varchar("transmission", { length: 50 }),
  
  // EV specific fields
  batteryCapacity: decimal("batteryCapacity", { precision: 6, scale: 2 }),
  range: int("range"), // WLTP range in miles
  realRange: int("realRange"), // Real-world range in miles
  chargingTime: varchar("chargingTime", { length: 100 }),
  acceleration: varchar("acceleration", { length: 50 }),
  topSpeed: int("topSpeed"),
  power: int("power"), // in kW
  
  // Images and media
  images: json("images").$type<string[]>(),
  mainImage: varchar("mainImage", { length: 500 }),
  
  // Additional info
  description: text("description"),
  features: json("features").$type<string[]>(),
  vin: varchar("vin", { length: 50 }),
  registrationNumber: varchar("registrationNumber", { length: 20 }),
  
  // Status
  isAvailable: boolean("isAvailable").default(true),
  isFeatured: boolean("isFeatured").default(false),
  
  // Marketplace type
  marketplace: mysqlEnum("marketplace", ["consumer", "dealer_only"]).default("consumer"),
  
  // Auction fields for dealer marketplace
  isAuction: boolean("isAuction").default(false),
  auctionStartDate: timestamp("auctionStartDate"),
  auctionEndDate: timestamp("auctionEndDate"),
  startingBid: decimal("startingBid", { precision: 10, scale: 2 }),
  reservePrice: decimal("reservePrice", { precision: 10, scale: 2 }), // Minimum acceptable price
  currentHighestBid: decimal("currentHighestBid", { precision: 10, scale: 2 }),
  buyNowPrice: decimal("buyNowPrice", { precision: 10, scale: 2 }), // Instant purchase price
  
  // Inspection reports (S3 URLs to PDF files)
  inspectionReports: json("inspectionReports").$type<Array<{url: string, name: string, type: string, uploadedAt: string}>>(),
  
  // Condition notes for dealer inventory
  conditionNotes: text("conditionNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Car reservations table
 */
export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  carId: int("carId").references(() => cars.id).notNull(),
  dealerId: int("dealerId").references(() => dealers.id),
  
  // Reservation details
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  reservationDate: timestamp("reservationDate").notNull(),
  viewingDate: timestamp("viewingDate"),
  
  // User contact info
  userName: varchar("userName", { length: 255 }),
  userEmail: varchar("userEmail", { length: 320 }),
  userPhone: varchar("userPhone", { length: 20 }),
  
  // Additional info
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * User favorites/wishlist
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  carId: int("carId").references(() => cars.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Saved searches
 */
export const savedSearches = mysqlTable("savedSearches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }),
  searchParams: json("searchParams").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Finance applications
 */
export const financeApplications = mysqlTable("financeApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  carId: int("carId").references(() => cars.id),
  
  // Application details
  status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected"]).default("draft"),
  loanAmount: decimal("loanAmount", { precision: 10, scale: 2 }),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }),
  term: int("term"), // in months
  monthlyPayment: decimal("monthlyPayment", { precision: 10, scale: 2 }),
  preApprovedAmount: decimal("preApprovedAmount", { precision: 10, scale: 2 }), // Max amount user can borrow
  creditScore: int("creditScore"), // Credit score from Evolution Funding
  
  // Applicant info
  applicantData: json("applicantData").$type<Record<string, any>>(),
  
  // Evolution Funding response
  externalApplicationId: varchar("externalApplicationId", { length: 100 }),
  responseData: json("responseData").$type<Record<string, any>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Car views tracking for analytics
 */
export const carViews = mysqlTable("carViews", {
  id: int("id").autoincrement().primaryKey(),
  carId: int("carId").references(() => cars.id).notNull(),
  userId: int("userId").references(() => users.id),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Car inquiries for dealer tracking
 */
export const carInquiries = mysqlTable("carInquiries", {
  id: int("id").autoincrement().primaryKey(),
  carId: int("carId").references(() => cars.id).notNull(),
  userId: int("userId").references(() => users.id),
  dealerId: int("dealerId").references(() => dealers.id),
  
  // Contact info
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  
  // Inquiry details
  message: text("message"),
  inquiryType: mysqlEnum("inquiryType", ["test_drive", "price_inquiry", "general", "finance"]).default("general"),
  status: mysqlEnum("status", ["new", "contacted", "closed"]).default("new"),
  
   createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Dealer applications table
 */
export const dealerApplications = mysqlTable("dealerApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  
  // Application details
  businessName: text("businessName").notNull(),
  contactName: text("contactName").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  description: text("description").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Test drive bookings table
 */
export const testDriveBookings = mysqlTable("testDriveBookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  carId: int("carId").references(() => cars.id).notNull(),
  dealerId: int("dealerId").references(() => dealers.id).notNull(),
  
  // Booking details
  preferredDate: timestamp("preferredDate").notNull(),
  preferredTime: varchar("preferredTime", { length: 20 }), // e.g., "10:00 AM", "2:00 PM"
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  
  // Customer contact info
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  
  // Additional info
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Dealer = typeof dealers.$inferSelect;
export type InsertDealer = typeof dealers.$inferInsert;
export type Car = typeof cars.$inferSelect;
export type InsertCar = typeof cars.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type FinanceApplication = typeof financeApplications.$inferSelect;
export type CarView = typeof carViews.$inferSelect;
export type CarInquiry = typeof carInquiries.$inferSelect;
export type DealerApplication = typeof dealerApplications.$inferSelect;
export type InsertDealerApplication = typeof dealerApplications.$inferInsert;
export type TestDriveBooking = typeof testDriveBookings.$inferSelect;
export type InsertTestDriveBooking = typeof testDriveBookings.$inferInsert;

/**
 * Dealer Bids table - for auction-style bidding on dealer marketplace vehicles
 */
export const dealerBids = mysqlTable("dealerBids", {
  id: int("id").autoincrement().primaryKey(),
  carId: int("carId").references(() => cars.id).notNull(),
  dealerId: int("dealerId").references(() => dealers.id).notNull(), // Dealer placing the bid
  userId: int("userId").references(() => users.id).notNull(), // User account of the dealer
  
  // Bid details
  bidAmount: decimal("bidAmount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"), // Optional message with the bid
  status: mysqlEnum("status", ["active", "outbid", "winning", "won", "lost"]).default("active").notNull(),
  
  // Payment tracking
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed"]).default("pending"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  paidAt: timestamp("paidAt"),
  
  // Inspection scheduling
  inspectionScheduledAt: timestamp("inspectionScheduledAt"),
  inspectionNotes: text("inspectionNotes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealerBid = typeof dealerBids.$inferSelect;
export type InsertDealerBid = typeof dealerBids.$inferInsert;

/**
 * Proxy Bids table - for automatic bidding up to a maximum amount
 */
export const proxyBids = mysqlTable("proxyBids", {
  id: int("id").autoincrement().primaryKey(),
  carId: int("carId").references(() => cars.id).notNull(),
  dealerId: int("dealerId").references(() => dealers.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(),
  
  // Proxy bid settings
  maxBidAmount: decimal("maxBidAmount", { precision: 10, scale: 2 }).notNull(), // Maximum amount willing to bid
  currentBidAmount: decimal("currentBidAmount", { precision: 10, scale: 2 }).notNull(), // Current actual bid placed
  incrementAmount: decimal("incrementAmount", { precision: 10, scale: 2 }).default("100.00"), // Auto-increment amount
  isActive: boolean("isActive").default(true).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProxyBid = typeof proxyBids.$inferSelect;
export type InsertProxyBid = typeof proxyBids.$inferInsert;

/**
 * Dealer Offers table - for dealer-to-dealer vehicle bidding
 */
export const dealerOffers = mysqlTable("dealerOffers", {
  id: int("id").autoincrement().primaryKey(),
  carId: int("carId").references(() => cars.id).notNull(),
  fromDealerId: int("fromDealerId").references(() => dealers.id).notNull(), // Dealer making the offer
  toDealerId: int("toDealerId").references(() => dealers.id).notNull(), // Dealer receiving the offer
  
  // Offer details
  offerAmount: decimal("offerAmount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"), // Optional message with the offer
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "countered", "withdrawn"]).default("pending").notNull(),
  
  // Counter offer
  counterAmount: decimal("counterAmount", { precision: 10, scale: 2 }),
  counterMessage: text("counterMessage"),
  
  // Timestamps
  expiresAt: timestamp("expiresAt"), // Optional expiry for time-limited offers
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealerOffer = typeof dealerOffers.$inferSelect;
export type InsertDealerOffer = typeof dealerOffers.$inferInsert;

/**
 * Dealer Reviews table - customer ratings and reviews for dealers
 */
export const dealerReviews = mysqlTable("dealerReviews", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").references(() => dealers.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(),
  
  // Review content
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText"),
  
  // Purchase verification
  purchaseId: int("purchaseId"), // Optional: link to dealerBids if review is from verified purchase
  
  // Moderation
  isVerified: boolean("isVerified").default(false), // Verified purchase
  isVisible: boolean("isVisible").default(true),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealerReview = typeof dealerReviews.$inferSelect;
export type InsertDealerReview = typeof dealerReviews.$inferInsert;

/**
 * Dealer Cart table - tracks vehicles selected for bulk purchase
 */
export const dealerCart = mysqlTable("dealerCart", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").references(() => dealers.id).notNull(),
  carId: int("carId").references(() => cars.id).notNull(),
  
  // Price at time of adding to cart
  priceAtAdd: decimal("priceAtAdd", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DealerCartItem = typeof dealerCart.$inferSelect;
export type InsertDealerCartItem = typeof dealerCart.$inferInsert;

/**
 * Dealer Watchlist table - tracks vehicles dealers are monitoring
 */
export const dealerWatchlist = mysqlTable("dealerWatchlist", {
  id: int("id").autoincrement().primaryKey(),
  dealerId: int("dealerId").references(() => dealers.id).notNull(),
  carId: int("carId").references(() => cars.id).notNull(),
  
  // Price tracking
  initialPrice: decimal("initialPrice", { precision: 10, scale: 2 }).notNull(),
  lastNotifiedPrice: decimal("lastNotifiedPrice", { precision: 10, scale: 2 }),
  
  // Alert preferences
  alertOnPriceDrop: boolean("alertOnPriceDrop").default(true),
  alertThreshold: decimal("alertThreshold", { precision: 5, scale: 2 }), // Percentage drop to trigger alert
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealerWatchlistItem = typeof dealerWatchlist.$inferSelect;
export type InsertDealerWatchlistItem = typeof dealerWatchlist.$inferInsert;

/**
 * Auction History table - tracks auction outcomes and winners
 */
export const auctionHistory = mysqlTable("auctionHistory", {
  id: int("id").autoincrement().primaryKey(),
  carId: int("carId").references(() => cars.id).notNull(),
  sellerDealerId: int("sellerDealerId").references(() => dealers.id).notNull(),
  
  // Auction details
  auctionStartDate: timestamp("auctionStartDate").notNull(),
  auctionEndDate: timestamp("auctionEndDate").notNull(),
  reservePrice: decimal("reservePrice", { precision: 10, scale: 2 }).notNull(),
  
  // Outcome
  status: mysqlEnum("status", ["completed", "expired_no_bids", "expired_below_reserve", "cancelled"]).notNull(),
  winningBidId: int("winningBidId").references(() => dealerBids.id),
  winnerDealerId: int("winnerDealerId").references(() => dealers.id),
  finalPrice: decimal("finalPrice", { precision: 10, scale: 2 }),
  totalBids: int("totalBids").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuctionHistory = typeof auctionHistory.$inferSelect;
export type InsertAuctionHistory = typeof auctionHistory.$inferInsert;
