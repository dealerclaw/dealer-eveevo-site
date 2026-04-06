import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import uploadImageRouter from "../uploadImage";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook MUST be registered before body parsers
  // Uses raw body for signature verification
  const { handleStripeWebhook } = await import('./stripe-webhook');
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  
  // Clerk webhook MUST be registered before body parsers
  const { handleClerkWebhook } = await import('./clerk-webhook');
  app.post('/api/clerk/webhook', express.raw({ type: 'application/json' }), handleClerkWebhook);
  
  // Configure cookie parser (must be before tRPC)
  app.use(cookieParser());
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "200mb" }));
  app.use(express.urlencoded({ limit: "200mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Image upload endpoint
  app.use("/api", uploadImageRouter);

  // DealerClaw REST API endpoints
  // POST /api/dealerclaw/push  — upsert a car listing from DealerClaw
  app.post('/api/dealerclaw/push', async (req, res) => {
    try {
      const secret = process.env.DEALERCLAW_SYNC_SECRET || '';
      const body = req.body;

      if (!secret || body?.secret !== secret) {
        return res.status(401).json({ error: 'Invalid sync secret' });
      }

      const { upsertDealerClawCar } = await import('../syncRouter');
      const result = await upsertDealerClawCar(body);
      return res.json({ ok: true, ...result });
    } catch (err) {
      console.error('[DealerClaw REST] POST /api/dealerclaw/push error:', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
    }
  });

  // DELETE /api/dealerclaw/delete  — soft-delete a car listing by DealerClaw car ID
  app.delete('/api/dealerclaw/delete', async (req, res) => {
    try {
      const secret = process.env.DEALERCLAW_SYNC_SECRET || '';
      const body = req.body;

      if (!secret || body?.secret !== secret) {
        return res.status(401).json({ error: 'Invalid sync secret' });
      }

      const dealerClawCarId = Number(body?.dealerClawCarId);
      if (!dealerClawCarId || isNaN(dealerClawCarId)) {
        return res.status(400).json({ error: 'dealerClawCarId is required and must be a number' });
      }

      const { softDeleteDealerClawCar } = await import('../syncRouter');
      const result = await softDeleteDealerClawCar(dealerClawCarId);
      return res.json({ ok: true, ...result });
    } catch (err) {
      console.error('[DealerClaw REST] DELETE /api/dealerclaw/delete error:', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
