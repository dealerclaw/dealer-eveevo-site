import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Referral Program', () => {
  let testDealerId: number;
  let referralCode: string;

  beforeAll(async () => {
    // Get a test dealer (assuming dealer ID 1 exists from previous tests)
    testDealerId = 1;
  });

  it('should generate a unique referral code for dealer', async () => {
    referralCode = await db.generateReferralCode(testDealerId);
    
    expect(referralCode).toBeDefined();
    expect(referralCode).toMatch(/^[A-Z0-9]{8}$/); // Format: 3 letters + 5 random chars
    expect(referralCode.length).toBe(8);
  });

  it('should retrieve dealer by referral code', async () => {
    const dealer = await db.getDealerByReferralCode(referralCode);
    
    expect(dealer).toBeDefined();
    expect(dealer?.id).toBe(testDealerId);
    expect(dealer?.referralCode).toBe(referralCode);
  });

  it('should return null for invalid referral code', async () => {
    const dealer = await db.getDealerByReferralCode('INVALID123');
    
    expect(dealer).toBeNull();
  });

  it('should get referral stats for dealer', async () => {
    const stats = await db.getDealerReferralStats(testDealerId);
    
    expect(stats).toBeDefined();
    expect(stats?.referralCode).toBe(referralCode);
    expect(stats?.referralCredits).toBeGreaterThanOrEqual(0);
    expect(stats?.successfulReferrals).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(stats?.referredDealers)).toBe(true);
  });
});
