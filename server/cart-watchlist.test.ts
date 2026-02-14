import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('Dealer Cart and Watchlist', () => {
  const testDealerId = 1;
  let testCarId: number;
  const testPrice = "25000.00";

  it('should get a valid car ID for testing', async () => {
    const cars = await db.getCars({ limit: 1 });
    expect(cars.length).toBeGreaterThan(0);
    testCarId = cars[0].id;
  });

  it('should add item to cart', async () => {
    try {
      await db.addToCart(testDealerId, testCarId, testPrice);
      const cart = await db.getCartItems(testDealerId);
      expect(cart.length).toBeGreaterThan(0);
    } catch (error: any) {
      // Item might already be in cart from previous test
      if (error.message !== 'Vehicle already in cart') {
        throw error;
      }
    }
  });

  it('should get cart items with details', async () => {
    const cart = await db.getCartItems(testDealerId);
    expect(Array.isArray(cart)).toBe(true);
    if (cart.length > 0) {
      expect(cart[0]).toHaveProperty('carId');
      expect(cart[0]).toHaveProperty('priceAtAdd');
      expect(cart[0]).toHaveProperty('make');
      expect(cart[0]).toHaveProperty('model');
    }
  });

  it('should calculate bulk discount correctly', async () => {
    // Test 2-4 cars discount (13%)
    const discount2Cars = await db.calculateBulkDiscount(3, 100000);
    expect(discount2Cars.discountPercent).toBe(13);
    expect(discount2Cars.discountedPrice).toBe(87000);
    expect(discount2Cars.savings).toBe(13000);

    // Test 5+ cars discount (10%)
    const discount5Cars = await db.calculateBulkDiscount(5, 100000);
    expect(discount5Cars.discountPercent).toBeCloseTo(10, 1);
    expect(discount5Cars.discountedPrice).toBeCloseTo(90000, 0);
    expect(discount5Cars.savings).toBeCloseTo(10000, 0);
  });

  it('should add item to watchlist', async () => {
    try {
      await db.addToWatchlist(testDealerId, testCarId, testPrice);
      const watchlist = await db.getWatchlistItems(testDealerId);
      expect(watchlist.length).toBeGreaterThan(0);
    } catch (error: any) {
      // Item might already be in watchlist from previous test
      if (error.message !== 'Vehicle already in watchlist') {
        throw error;
      }
    }
  });

  it('should get watchlist items with details', async () => {
    const watchlist = await db.getWatchlistItems(testDealerId);
    expect(Array.isArray(watchlist)).toBe(true);
    if (watchlist.length > 0) {
      expect(watchlist[0]).toHaveProperty('carId');
      expect(watchlist[0]).toHaveProperty('initialPrice');
      expect(watchlist[0]).toHaveProperty('make');
      expect(watchlist[0]).toHaveProperty('model');
      expect(watchlist[0]).toHaveProperty('alertOnPriceDrop');
    }
  });

  it('should check for price drops', async () => {
    const priceDrops = await db.checkPriceDrops(testDealerId);
    expect(Array.isArray(priceDrops)).toBe(true);
    // Price drops array may be empty if no prices have dropped
  });

  it('should remove item from cart', async () => {
    await db.removeFromCart(testDealerId, testCarId);
    const cart = await db.getCartItems(testDealerId);
    const hasItem = cart.some(item => item.carId === testCarId);
    expect(hasItem).toBe(false);
  });

  it('should remove item from watchlist', async () => {
    await db.removeFromWatchlist(testDealerId, testCarId);
    const watchlist = await db.getWatchlistItems(testDealerId);
    const hasItem = watchlist.some(item => item.carId === testCarId);
    expect(hasItem).toBe(false);
  });
});
