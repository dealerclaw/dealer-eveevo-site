import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createClerkClient, verifyToken } from "@clerk/express";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** The actual admin user when impersonating (null if not impersonating) */
  adminUser: User | null;
};

const IMPERSONATION_COOKIE = 'eveevo_impersonate';

// Admin email allowlist — these accounts always get admin role regardless of Clerk metadata
const ADMIN_EMAIL_ALLOWLIST = [
  'anthony.perry@eveevo.com',
  'anthony.m.perry@gmail.com',
  'rebecca.jackson@eveevo.co.uk',
  'rebecca@rebeccaracer.com',
];

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let adminUser: User | null = null;

  try {
    // Get Clerk session token from Authorization header
    const authHeader = opts.req.headers.authorization;
    const sessionToken = authHeader?.replace('Bearer ', '');
    
    if (!sessionToken) {
      // Silent fail for public procedures
      return { req: opts.req, res: opts.res, user: null, adminUser: null };
    }

    // Verify Clerk JWT token using @clerk/express verifyToken
    let sessionClaims;
    try {
      sessionClaims = await verifyToken(sessionToken, {
        secretKey: ENV.clerkSecretKey,
      });
    } catch (error) {
      console.log('[Auth Context] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return { req: opts.req, res: opts.res, user: null, adminUser: null };
    }
    
    if (!sessionClaims || !sessionClaims.sub) {
      console.log('[Auth Context] Invalid Clerk session: No user ID');
      return { req: opts.req, res: opts.res, user: null, adminUser: null };
    }

    const clerkUserId = sessionClaims.sub;
    
    // Try to get user from database first (faster and more reliable)
    let authenticatedUser = (await db.getUserByOpenId(clerkUserId)) ?? null;
    
    if (!authenticatedUser) {
      console.log('[Auth Context] User not in database, fetching from Clerk API');
      
      // Get Clerk user using backend SDK
      const client = createClerkClient({ secretKey: ENV.clerkSecretKey });
      let clerkUser;
      try {
        clerkUser = await client.users.getUser(clerkUserId);
      } catch (error) {
        console.log('[Auth Context] Failed to fetch user from Clerk:', error instanceof Error ? error.message : 'Unknown error');
        return { req: opts.req, res: opts.res, user: null, adminUser: null };
      }
      
      if (!clerkUser) {
        console.log('[Auth Context] Clerk user not found');
        return { req: opts.req, res: opts.res, user: null, adminUser: null };
      }

      // Get role and accountType from Clerk metadata
      const rawRole = (clerkUser.unsafeMetadata?.role as string) || 'user';
      const rawAccountType = (clerkUser.unsafeMetadata?.accountType as string) || 'individual';
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      // Admin allowlist overrides Clerk metadata
      const isAdminEmail = ADMIN_EMAIL_ALLOWLIST.includes(email.toLowerCase());
      const role = isAdminEmail ? 'admin' : (rawRole === 'dealer' ? 'dealer' : rawRole === 'admin' ? 'admin' : 'user');
      const accountType = isAdminEmail ? 'business' : (rawAccountType === 'business' ? 'business' : 'individual');

      // Sync or get user from database
      await db.upsertUser({
        openId: clerkUser.id,
        name: clerkUser.fullName || email.split('@')[0] || 'User',
        email: email,
        loginMethod: 'clerk',
        role: role as 'user' | 'dealer' | 'admin',
        accountType: accountType as 'individual' | 'business',
        lastSignedIn: new Date(),
      });

      authenticatedUser = (await db.getUserByOpenId(clerkUser.id)) ?? null;
    }
    
    if (!authenticatedUser) {
      console.log('[Auth Context] Failed to get/sync user');
      return { req: opts.req, res: opts.res, user: null, adminUser: null };
    }

    // Check for admin impersonation cookie
    const impersonateCookie = opts.req.cookies?.[IMPERSONATION_COOKIE];
    
    if (impersonateCookie && authenticatedUser.role === 'admin') {
      // Admin is impersonating another user
      const impersonatedUserId = parseInt(impersonateCookie, 10);
      if (!isNaN(impersonatedUserId)) {
        const impersonatedUser = await db.getUserById(impersonatedUserId);
        if (impersonatedUser) {
          adminUser = authenticatedUser;
          user = impersonatedUser;
          return { req: opts.req, res: opts.res, user, adminUser };
        }
      }
    }

    user = authenticatedUser;
  } catch (error) {
    // Authentication is optional for public procedures.
    console.log('[Auth Context] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
    user = null;
    adminUser = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    adminUser,
  };
}
