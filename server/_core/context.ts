import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env";
import * as db from "../db";
import { isAdminEmail } from "../localAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** The actual admin user when impersonating (null if not impersonating) */
  adminUser: User | null;
};

const IMPERSONATION_COOKIE = 'eveevo_impersonate';

// ---------------------------------------------------------------------------
// In-memory cache for verified session tokens → user id
// Avoids re-verifying the JWT on every request; the user row itself is
// re-read so role changes take effect quickly.
// ---------------------------------------------------------------------------
interface CacheEntry {
  userId: number;
  expiresAt: number; // Unix timestamp (ms)
}

const tokenCache = new Map<string, CacheEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  Array.from(tokenCache.entries()).forEach(([key, entry]) => {
    if (entry.expiresAt <= now) {
      tokenCache.delete(key);
    }
  });
}, 5 * 60 * 1000);

async function resolveUserId(sessionToken: string): Promise<number | null> {
  const cached = tokenCache.get(sessionToken);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.userId;
  }

  if (!ENV.cookieSecret) return null;
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(sessionToken, secret, {
      algorithms: ["HS256"],
    });
    const userId = typeof payload.uid === "number" ? payload.uid : null;
    if (!userId) return null;
    const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + 60 * 60 * 1000;
    tokenCache.set(sessionToken, { userId, expiresAt });
    return userId;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let adminUser: User | null = null;

  try {
    // Session token from cookie (preferred) or Authorization header
    const authHeader = opts.req.headers.authorization;
    const sessionToken =
      opts.req.cookies?.[COOKIE_NAME] || authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      // Silent fail for public procedures
      return { req: opts.req, res: opts.res, user: null, adminUser: null };
    }

    const userId = await resolveUserId(sessionToken);
    if (!userId) {
      return { req: opts.req, res: opts.res, user: null, adminUser: null };
    }

    let authenticatedUser = (await db.getUserById(userId)) ?? null;
    if (!authenticatedUser) {
      return { req: opts.req, res: opts.res, user: null, adminUser: null };
    }

    // Admin email allowlist always wins over the stored role
    if (isAdminEmail(authenticatedUser.email) && authenticatedUser.role !== 'admin') {
      await db.updateUserFields(authenticatedUser.id, { role: 'admin' });
      authenticatedUser = { ...authenticatedUser, role: 'admin' };
    }

    // Auto-provision dealer record for dealer users (idempotent)
    if (authenticatedUser.role === 'dealer') {
      db.ensureDealerRecord(
        authenticatedUser.id,
        authenticatedUser.name || '',
        authenticatedUser.email || ''
      ).catch(err => console.error('[Auth Context] ensureDealerRecord failed:', err));
    }

    // Check for admin impersonation cookie
    const impersonateCookie = opts.req.cookies?.[IMPERSONATION_COOKIE];
    if (impersonateCookie && authenticatedUser.role === 'admin') {
      const impersonatedUserId = parseInt(impersonateCookie, 10);
      if (!isNaN(impersonatedUserId)) {
        const impersonatedUser = await db.getUserById(impersonatedUserId);
        if (impersonatedUser) {
          return {
            req: opts.req,
            res: opts.res,
            user: impersonatedUser,
            adminUser: authenticatedUser,
          };
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
