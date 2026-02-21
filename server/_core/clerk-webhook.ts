import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function handleClerkWebhook(req: Request, res: Response) {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('[Clerk Webhook] Missing CLERK_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Get the body - req.body is a Buffer from express.raw()
  const body = req.body.toString();
  const payload = JSON.parse(body);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: any;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('[Clerk Webhook] Error verifying webhook:', err);
    return res.status(400).json({ error: 'Webhook verification failed' });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`[Clerk Webhook] Received event: ${eventType}`);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, unsafe_metadata } = payload.data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ') || email?.split('@')[0] || 'User';
    
    // Map role: 'consumer' -> 'user', 'dealer' -> 'dealer', default 'user'
    let role = unsafe_metadata?.role || 'user';
    if (role === 'consumer') role = 'user';
    
    // Map accountType: 'consumer' -> 'individual', 'dealer' -> 'business', default 'individual'
    let accountType = unsafe_metadata?.accountType || 'individual';
    if (accountType === 'consumer') accountType = 'individual';
    if (accountType === 'dealer') accountType = 'business';

    if (!email) {
      console.error('[Clerk Webhook] No email found in user data');
      return res.status(400).json({ error: 'No email found' });
    }

    try {
      const db = await getDb();
      if (!db) {
        console.error('[Clerk Webhook] Database not available');
        return res.status(500).json({ error: 'Database not available' });
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        await db.update(users)
          .set({
            name,
            role: role as 'user' | 'dealer' | 'admin',
            accountType: accountType as 'user' | 'dealer',
            lastSignedIn: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.email, email));
        
        console.log(`[Clerk Webhook] Updated user: ${email} with role: ${role}`);
      } else {
        // Create new user
        await db.insert(users).values({
          openId: id, // Use Clerk user ID as openId
          email,
          name,
          role: role as 'user' | 'dealer' | 'admin',
          accountType: accountType as 'user' | 'dealer',
          loginMethod: 'clerk',
          emailVerified: true, // Clerk handles email verification
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        });

        console.log(`[Clerk Webhook] Created user: ${email} with role: ${role}`);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Clerk Webhook] Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(200).json({ success: true });
}
