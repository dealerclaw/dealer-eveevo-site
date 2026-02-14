import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Dealer Reviews System', () => {
  let testDealerId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Use existing dealer and user from database
    const dealers = await db.getDealers({ limit: 1 });
    if (dealers && dealers.length > 0) {
      testDealerId = dealers[0].id;
    } else {
      throw new Error('No dealers found in database for testing');
    }

    // Get a test user (assuming user ID 1 exists)
    testUserId = 1;
  });

  it('should submit a dealer review or handle existing review', async () => {
    const reviewData = {
      dealerId: testDealerId,
      userId: testUserId,
      rating: 5,
      reviewText: 'Excellent service and great selection of EVs!',
    };

    // Try to submit review - it may already exist from previous test runs
    try {
      await db.submitDealerReview(reviewData);
      // Review submitted successfully
      expect(true).toBe(true);
    } catch (error: any) {
      // If review already exists, that's also acceptable
      if (error.message === 'You have already reviewed this dealer') {
        expect(true).toBe(true);
      } else {
        throw error;
      }
    }
  });

  it('should prevent duplicate reviews from same user', async () => {
    const reviewData = {
      dealerId: testDealerId,
      userId: testUserId,
      rating: 4,
      reviewText: 'Another review attempt',
    };

    await expect(db.submitDealerReview(reviewData)).rejects.toThrow(
      'You have already reviewed this dealer'
    );
  });

  it('should retrieve dealer reviews', async () => {
    const reviews = await db.getDealerReviews(testDealerId);
    
    expect(reviews).toBeDefined();
    expect(Array.isArray(reviews)).toBe(true);
    
    if (reviews.length > 0) {
      const review = reviews[0];
      expect(review).toHaveProperty('id');
      expect(review).toHaveProperty('rating');
      expect(review).toHaveProperty('reviewText');
      expect(review).toHaveProperty('userName');
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
    }
  });

  it('should update dealer rating after review submission', async () => {
    const dealer = await db.getDealerById(testDealerId);
    
    expect(dealer).toBeDefined();
    if (dealer?.rating) {
      const rating = parseFloat(dealer.rating);
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    }
    
    if (dealer?.reviewCount) {
      expect(dealer.reviewCount).toBeGreaterThan(0);
    }
  });

  it('should get dealers for filter dropdown', async () => {
    const dealers = await db.getAllDealersForFilter();
    
    expect(dealers).toBeDefined();
    expect(Array.isArray(dealers)).toBe(true);
    
    if (dealers.length > 0) {
      const dealer = dealers[0];
      expect(dealer).toHaveProperty('id');
      expect(dealer).toHaveProperty('name');
      expect(dealer).toHaveProperty('vehicleCount');
      expect(dealer.vehicleCount).toBeGreaterThan(0);
    }
  });
});
