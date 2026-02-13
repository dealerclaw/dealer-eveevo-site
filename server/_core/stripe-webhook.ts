import type { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "../db";
import { notifyOwner } from "./notification";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Handle Stripe webhook events
 * Must be registered with express.raw() middleware before express.json()
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('[Webhook] No signature found');
    return res.status(400).send('No signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Webhook] Test event detected, returning verification response');
    return res.json({ verified: true });
  }

  console.log('[Webhook] Processing event:', event.type, event.id);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  console.log('[Webhook] Subscription update:', {
    customerId,
    subscriptionId,
    status,
  });

  // Get dealer by Stripe customer ID
  const dealer = await db.getDealerByStripeCustomerId(customerId);
  
  if (!dealer) {
    console.warn('[Webhook] No dealer found for customer:', customerId);
    return;
  }

  // Update dealer subscription status
  // Note: 'trialing' status means the subscription is active during trial period
  const subscriptionStatus = status === 'active' || status === 'trialing' ? 'active' : 
                             status === 'past_due' ? 'active' : 
                             'expired';
  
  const expiresAt = (subscription as any).current_period_end 
    ? new Date((subscription as any).current_period_end * 1000) 
    : null;

  await db.updateDealerSubscription(dealer.id, {
    subscriptionStatus,
    subscriptionExpiresAt: expiresAt,
    stripeSubscriptionId: subscriptionId,
  });

  console.log('[Webhook] Updated dealer subscription:', {
    dealerId: dealer.id,
    status: subscriptionStatus,
    expiresAt,
  });

  // Send confirmation notification to owner on first activation (including trial)
  if (subscriptionStatus === 'active' && (status === 'active' || status === 'trialing')) {
    await notifyOwner({
      title: `New Dealer Subscription: ${dealer.name}`,
      content: `Dealer ${dealer.name} (${dealer.email || 'No email'}) has subscribed to the marketplace.\n\nSubscription ID: ${subscriptionId}\nExpires: ${expiresAt?.toLocaleDateString() || 'N/A'}\nDealer ID: ${dealer.id}`,
    });
    console.log('[Webhook] Sent subscription confirmation notification');
  }
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  console.log('[Webhook] Subscription deleted:', customerId);

  const dealer = await db.getDealerByStripeCustomerId(customerId);
  
  if (!dealer) {
    console.warn('[Webhook] No dealer found for customer:', customerId);
    return;
  }

  await db.updateDealerSubscription(dealer.id, {
    subscriptionStatus: 'expired',
    subscriptionExpiresAt: new Date(),
  });

  console.log('[Webhook] Deactivated dealer subscription:', dealer.id);
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Checkout completed:', session.id);

  // Check if this is a subscription checkout
  if (session.mode === 'subscription' && session.customer) {
    const customerId = session.customer as string;
    const userId = session.client_reference_id;

    if (!userId) {
      console.warn('[Webhook] No user ID in checkout session');
      return;
    }

    // Update dealer with Stripe customer ID
    const dealer = await db.getDealerByUserId(parseInt(userId));
    
    if (dealer) {
      await db.updateDealerSubscription(dealer.id, {
        stripeCustomerId: customerId,
      });

      console.log('[Webhook] Linked dealer to Stripe customer:', {
        dealerId: dealer.id,
        customerId,
      });

      // Check for referral code in metadata
      const referralCode = session.metadata?.referralCode;
      if (referralCode) {
        const referrer = await db.getDealerByReferralCode(referralCode);
        if (referrer && referrer.id !== dealer.id) {
          await db.trackReferral(dealer.id, referrer.id);
          console.log('[Webhook] Tracked referral:', {
            referredDealerId: dealer.id,
            referrerDealerId: referrer.id,
            referralCode,
          });

          // Notify owner about referral
          await notifyOwner({
            title: `Referral Success: ${referrer.name} referred ${dealer.name}`,
            content: `${dealer.name} subscribed using referral code ${referralCode} from ${referrer.name}.\n\n£20 credit added to ${referrer.name}'s account.\n\nReferrer ID: ${referrer.id}\nNew Dealer ID: ${dealer.id}`,
          });
        }
      }
    }
  }

  // Handle one-time payment (e.g., vehicle reservation)
  if (session.mode === 'payment') {
    // Payment intent will be handled separately if needed
    console.log('[Webhook] One-time payment completed');
  }
}
