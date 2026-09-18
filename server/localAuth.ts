// Local email/password + Google SSO authentication (replaces Clerk).
// Sessions are signed JWTs stored in the app_session_id cookie.

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { SignJWT } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import * as db from "./db";

const scryptAsync = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const key = await scryptAsync(password, salt);
  const expected = Buffer.from(hash, "hex");
  return (
    expected.length === key.length && crypto.timingSafeEqual(key, expected)
  );
}

export const ADMIN_EMAIL_ALLOWLIST = [
  "anthony.perry@eveevo.com",
  "anthony.perry@eveevo.co.uk",
  "anthony.m.perry@gmail.com",
  "rebecca.jackson@eveevo.co.uk",
  "rebecca@rebeccaracer.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAIL_ALLOWLIST.includes(email.toLowerCase());
}

export async function createSessionToken(userId: number): Promise<string> {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is not configured");
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(secret);
}

async function setSessionCookie(req: Request, res: Response, userId: number) {
  const token = await createSessionToken(userId);
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

function normalizeRole(role: unknown): "user" | "dealer" {
  return role === "dealer" ? "dealer" : "user";
}

function normalizeAccountType(t: unknown): "individual" | "business" {
  return t === "business" ? "business" : "individual";
}

function sanitizeReturnTo(value: unknown): string {
  if (typeof value !== "string") return "/";
  // Only allow same-origin relative paths
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

const router = Router();

// ---------------------------------------------------------------------------
// Email / password
// ---------------------------------------------------------------------------

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, accountType } = req.body ?? {};
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.getUserByEmail(normalizedEmail);
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    const admin = isAdminEmail(normalizedEmail);
    const userId = await db.createEmailUser({
      name:
        typeof name === "string" && name.trim()
          ? name.trim()
          : normalizedEmail.split("@")[0],
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role: admin ? "admin" : normalizeRole(role),
      accountType: admin ? "business" : normalizeAccountType(accountType),
    });

    await setSessionCookie(req, res, userId);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Auth] register failed:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await db.getUserByEmail(email.trim().toLowerCase());
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Admin allowlist always wins
    if (isAdminEmail(user.email) && user.role !== "admin") {
      await db.updateUserFields(user.id, { role: "admin" });
    }
    await db.updateUserFields(user.id, { lastSignedIn: new Date() });

    await setSessionCookie(req, res, user.id);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Auth] login failed:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (req, res) => {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Google SSO
// ---------------------------------------------------------------------------

const GOOGLE_STATE_COOKIE = "eveevo_google_state";

function getRedirectUri(req: Request): string {
  const proto =
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ||
    req.protocol;
  return `${proto}://${req.get("host")}/api/auth/google/callback`;
}

router.get("/auth/google", (req, res) => {
  if (!ENV.googleClientId) {
    return res
      .status(500)
      .send("Google sign-in is not configured (GOOGLE_CLIENT_ID missing)");
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const state = Buffer.from(
    JSON.stringify({
      nonce,
      returnTo: sanitizeReturnTo(req.query.returnTo),
      role: normalizeRole(req.query.role),
      accountType: normalizeAccountType(req.query.accountType),
    })
  ).toString("base64url");

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(GOOGLE_STATE_COOKIE, nonce, {
    ...cookieOptions,
    maxAge: 10 * 60 * 1000,
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", ENV.googleClientId);
  url.searchParams.set("redirect_uri", getRedirectUri(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  res.redirect(302, url.toString());
});

router.get("/auth/google/callback", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const rawState = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !rawState) {
      return res.status(400).send("Missing code or state");
    }

    let state: {
      nonce?: string;
      returnTo?: string;
      role?: string;
      accountType?: string;
    };
    try {
      state = JSON.parse(Buffer.from(rawState, "base64url").toString("utf-8"));
    } catch {
      return res.status(400).send("Invalid state");
    }

    const cookieNonce = req.cookies?.[GOOGLE_STATE_COOKIE];
    if (!cookieNonce || cookieNonce !== state.nonce) {
      return res.status(400).send("State mismatch — please try signing in again");
    }
    res.clearCookie(GOOGLE_STATE_COOKIE, {
      ...getSessionCookieOptions(req),
      maxAge: -1,
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: getRedirectUri(req),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text().catch(() => "");
      console.error("[Auth] Google token exchange failed:", detail);
      return res.status(502).send("Google sign-in failed");
    }

    const { id_token: idToken } = (await tokenResponse.json()) as {
      id_token?: string;
    };
    if (!idToken) return res.status(502).send("Google sign-in failed");

    // The id_token comes directly from Google over TLS, so decoding the
    // payload without re-verifying the signature is safe here.
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf-8")
    ) as { sub: string; email?: string; name?: string; email_verified?: boolean };

    const email = (payload.email ?? "").toLowerCase();
    const openId = `google:${payload.sub}`;

    let user = await db.getUserByOpenId(openId);
    if (!user && email) {
      // Link an existing email/password account with the same address
      user = await db.getUserByEmail(email);
      if (user) {
        await db.updateUserFields(user.id, { openId, loginMethod: "google" });
      }
    }

    if (!user) {
      const admin = isAdminEmail(email);
      const userId = await db.createEmailUser({
        name: payload.name || email.split("@")[0] || "User",
        email,
        passwordHash: null,
        role: admin ? "admin" : normalizeRole(state.role),
        accountType: admin ? "business" : normalizeAccountType(state.accountType),
        openId,
        loginMethod: "google",
        emailVerified: payload.email_verified ?? true,
      });
      user = await db.getUserById(userId);
    }

    if (!user) return res.status(500).send("Failed to create account");

    if (isAdminEmail(user.email) && user.role !== "admin") {
      await db.updateUserFields(user.id, { role: "admin" });
    }
    await db.updateUserFields(user.id, { lastSignedIn: new Date() });

    await setSessionCookie(req, res, user.id);
    return res.redirect(302, sanitizeReturnTo(state.returnTo));
  } catch (err) {
    console.error("[Auth] Google callback failed:", err);
    return res.status(500).send("Google sign-in failed");
  }
});

export default router;
