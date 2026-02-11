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
} as const;

export type ProductType = keyof typeof PRODUCTS;
