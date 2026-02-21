import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createClerkClient } from "@clerk/express";
import { jwtVerify, createRemoteJWKSet } from "jose";
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

    console.log('[Auth Context] Verifying Clerk session token:', sessionToken.substring(0, 20) + '...');

    // Verify Clerk JWT token using jose
    let sessionClaims;
    try {
      // Get Clerk's JWKS URL from the token issuer
      const JWKS = createRemoteJWKSet(
        new URL('https://social-ant-80.clerk.accounts.dev/.well-known/jwks.json')
      );
      
      const { payload } = await jwtVerify(sessionToken, JWKS, {
        issuer: 'https://social-ant-80.clerk.accounts.dev',
      });
      
      sessionClaims = payload;
    } catch (error) {
      console.log('[Auth Context] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return { req: opts.req, res: opts.res, user: null };
    }
    
    if (!sessionClaims || !sessionClaims.sub) {
      console.log('[Auth Context] Invalid Clerk session: No user ID');
      return { req: opts.req, res: opts.res, user: null };
    }

    console.log('[Auth Context] JWT verified successfully, user ID:', sessionClaims.sub);
    
    // Try to get user from database first (faster and more reliable)
    user = await db.getUserByOpenId(sessionClaims.sub);
    
    if (user) {
      console.log('[Auth Context] User found in database:', user.email, 'role:', user.role);
      return { req: opts.req, res: opts.res, user };
    }
    
    console.log('[Auth Context] User not in database, fetching from Clerk API');
    
    // Get Clerk user using backend SDK
    const client = createClerkClient({ secretKey: ENV.clerkSecretKey });
    let clerkUser;
    try {
      clerkUser = await client.users.getUser(sessionClaims.sub);
    } catch (error) {
      console.log('[Auth Context] Failed to fetch user from Clerk:', error instanceof Error ? error.message : 'Unknown error');
      return { req: opts.req, res: opts.res, user: null };
    }
    
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
      console.log('[Auth Context] User synced to database:', user.email, 'role:', user.role);
    } else {
      console.log('[Auth Context] Failed to sync user to database');
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
