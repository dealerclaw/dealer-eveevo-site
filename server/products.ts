/**
 * Stripe Products Configuration
 * Centralized product and price definitions for the EVEEVO platform
 */

export const PRODUCTS = {
  VEHICLE_RESERVATION: {
    name: "Vehicle Reservation Deposit",
    description: "Refundable deposit to reserve your electric vehicle",
    price: 9900, // £99.00 in pence
    currency: "gbp",
    metadata: {
      type: "reservation",
      refundable: "true",
    },
  },
  DEALER_SUBSCRIPTION: {
    name: "Dealer-to-Dealer Marketplace Access",
    description: "Monthly subscription to buy and sell vehicles on the dealer marketplace",
    price: 9900, // £99.00 in pence per month
    currency: "gbp",
    interval: "month" as const,
    metadata: {
      type: "subscription",
      access: "dealer_marketplace",
    },
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;
