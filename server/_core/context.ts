import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createClerkClient } from "@clerk/express";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get Clerk session token from Authorization header
    const authHeader = opts.req.headers.authorization;
    const sessionToken = authHeader?.replace('Bearer ', '');
    
    if (!sessionToken) {
      // Silent fail for public procedures
      return { req: opts.req, res: opts.res, user: null };
    }

    console.log('[Auth Context] Verifying Clerk session token');

    // Verify Clerk session token and get user
    const client = createClerkClient({ secretKey: ENV.clerkSecretKey });
    const sessionClaims = await client.verifyToken(sessionToken);
    
    if (!sessionClaims || !sessionClaims.sub) {
      console.log('[Auth Context] Invalid Clerk session: No user ID');
      return { req: opts.req, res: opts.res, user: null };
    }

    // Get Clerk user
    const clerkUser = await client.users.getUser(sessionClaims.sub);
    
    if (!clerkUser) {
      console.log('[Auth Context] Clerk user not found');
      return { req: opts.req, res: opts.res, user: null };
    }

    // Get role and accountType from Clerk metadata
    const rawRole = (clerkUser.unsafeMetadata?.role as string) || 'user';
    const rawAccountType = (clerkUser.unsafeMetadata?.accountType as string) || 'individual';
    const role = rawRole === 'dealer' ? 'dealer' : rawRole === 'admin' ? 'admin' : 'user';
    const accountType = rawAccountType === 'business' ? 'business' : 'individual';

    // Sync or get user from database
    const email = clerkUser.primaryEmailAddress?.emailAddress || '';
    await db.upsertUser({
      openId: clerkUser.id,
      name: clerkUser.fullName || email.split('@')[0] || 'User',
      email: email,
      loginMethod: 'clerk',
      role: role as 'user' | 'dealer' | 'admin',
      accountType: accountType as 'individual' | 'business',
      lastSignedIn: new Date(),
    });

    user = await db.getUserByOpenId(clerkUser.id);
    
    if (user) {
      console.log('[Auth Context] User authenticated:', user.email, 'role:', user.role);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.log('[Auth Context] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
