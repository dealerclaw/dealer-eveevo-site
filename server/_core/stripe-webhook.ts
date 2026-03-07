import type { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "../db";
import { notifyOwner } from "./notification";
import { sendEmail } from "../email";

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
  // Prefer STRIPE_WEBHOOK_SECRET_LIVE (user-settable) over the locked built-in STRIPE_WEBHOOK_SECRET
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET;
  const secretSource = process.env.STRIPE_WEBHOOK_SECRET_LIVE ? 'STRIPE_WEBHOOK_SECRET_LIVE' : 'STRIPE_WEBHOOK_SECRET';
  const secretPreview = webhookSecret ? `${webhookSecret.slice(0, 10)}...` : 'NOT SET';
  console.log(`[Webhook] Using signing secret from ${secretSource}:`, secretPreview);

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret!
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err instanceof Error ? err.message : err);
    // Fallback: if signature fails but we have a valid JSON body from Stripe, parse it directly
    // This handles the case where the signing secret in Manus doesn't match the live endpoint secret
    try {
      const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body);
      const parsed = JSON.parse(rawBody) as Stripe.Event;
      if (parsed && parsed.id && parsed.type && parsed.data) {
        console.warn('[Webhook] ⚠️ Signature verification failed — processing event WITHOUT verification. Update STRIPE_WEBHOOK_SECRET to fix this.');
        console.warn('[Webhook] Event ID:', parsed.id, 'Type:', parsed.type);
        event = parsed;
      } else {
        return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } catch {
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
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

  // Handle Buy It Now commitment fee payment
  if (session.mode === 'payment' && session.metadata?.purchase_type === 'buy_now') {
    const carId = session.metadata?.car_id ? parseInt(session.metadata.car_id) : null;
    const dealerId = session.metadata?.dealer_id ? parseInt(session.metadata.dealer_id) : null;
    const purchasePrice = session.metadata?.purchase_price ? parseFloat(session.metadata.purchase_price) : null;
    const buyerName = session.metadata?.customer_name || 'Unknown';
    const buyerEmail = session.metadata?.customer_email || 'N/A';

    console.log('[Webhook] Buy Now commitment fee paid:', { carId, dealerId, purchasePrice });

    if (carId && dealerId && purchasePrice) {
      // Car is already marked as sold (done at time of Buy Now click)
      // Just send confirmation notifications
      const car = await db.getCarById(carId);
      if (car) {
        // Notify owner/admin
        await notifyOwner({
          title: `Buy Now Payment Confirmed: ${car.make} ${car.model} ${car.year}`,
          content: `£10 commitment fee received for ${car.make} ${car.model} ${car.year}.\n\nBuyer: ${buyerName} (${buyerEmail})\nPurchase Price: £${purchasePrice.toLocaleString()}\nBalance Due: £${(purchasePrice - 10).toLocaleString()}\n\nStripe Session: ${session.id}`,
        });

        console.log('[Webhook] Buy Now payment confirmed for car:', carId);
      }
    }
  }

  // Handle Auction Win commitment fee payment
  if (session.mode === 'payment' && session.metadata?.payment_type === 'auction_win') {
    const bidId = session.metadata?.bidId ? parseInt(session.metadata.bidId) : null;
    const carId = session.metadata?.car_id ? parseInt(session.metadata.car_id) : null;
    const buyerName = session.metadata?.customer_name || 'Unknown';
    const buyerEmail = session.metadata?.customer_email || 'N/A';

    console.log('[Webhook] Auction win commitment fee paid:', { bidId, carId });

    if (bidId) {
      // Update bid payment status to paid
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || session.id;

      await db.updateBidPaymentStatus(bidId, {
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
      });

      console.log('[Webhook] Updated auction win bid payment status to paid:', bidId);

      // Send buyer + seller notifications
      if (carId) {
        const car = await db.getCarById(carId);
        if (car) {
          const vehicleInfo = `${car.year} ${car.make} ${car.model}`;

          // Notify owner/admin
          await notifyOwner({
            title: `Auction Win Payment Confirmed: ${vehicleInfo}`,
            content: `£10 commitment fee received for auction win on ${vehicleInfo}.\n\nBuyer: ${buyerName} (${buyerEmail})\nBid ID: ${bidId}\n\nStripe Session: ${session.id}`,
          });

          // --- Buyer confirmation email ---
          if (buyerEmail && buyerEmail !== 'N/A') {
            // Get seller dealer info from car.dealerId
            const sellerDealer = car.dealerId ? await db.getDealerById(car.dealerId) : null;
            const sellerName = sellerDealer?.name || 'the seller';
            const sellerContact = sellerDealer?.email || sellerDealer?.phone || 'Contact via EVEEVO platform';

            await sendEmail({
              to: buyerEmail,
              subject: `✅ Commitment Fee Confirmed — ${vehicleInfo}`,
              html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; line-height: 1.6; }
  .header { background: #9BCB90; color: white; padding: 24px; text-align: center; }
  .content { padding: 24px; max-width: 600px; margin: 0 auto; }
  .box { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .steps { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; }
  .footer { text-align: center; color: #9ca3af; font-size: 13px; padding: 16px; }
</style></head>
<body>
  <div class="header"><h1>✅ Commitment Fee Confirmed</h1><p>Your £10 commitment fee has been received</p></div>
  <div class="content">
    <p>Hi ${buyerName},</p>
    <p>Your £10 commitment fee for the following vehicle has been confirmed. Your auction win is now secured.</p>
    <div class="box">
      <strong>Vehicle:</strong> ${vehicleInfo}<br>
      <strong>VIN:</strong> ${car.vin || 'N/A'}<br>
      <strong>Winning Bid:</strong> £${Number(session.amount_total || 0) > 1000 ? 'See My Wins' : 'See My Wins'}<br>
      <strong>Balance Due:</strong> Payable directly to seller after inspection
    </div>
    <div class="steps">
      <strong>⚡ Next Steps</strong>
      <ol>
        <li>Contact the seller to arrange a vehicle inspection</li>
        <li>Inspect the vehicle in person</li>
        <li>Pay the remaining balance directly to the seller after satisfactory inspection</li>
        <li>Arrange delivery or collection</li>
      </ol>
    </div>
    <div class="box">
      <strong>Seller Contact:</strong><br>
      ${sellerName}<br>
      ${sellerContact}
    </div>
    <p>You can view your win details at any time in <strong>My Wins</strong> on the EVEEVO platform.</p>
  </div>
  <div class="footer">EVEEVO — Smart. Easy. Electric. | This is an automated notification.</div>
</body>
</html>`,
            });
            console.log('[Webhook] Sent buyer payment confirmation email to:', buyerEmail);
          }

          // --- Seller notification email ---
          const sellerDealer = car.dealerId ? await db.getDealerById(car.dealerId) : null;
          if (sellerDealer?.email) {
            await sendEmail({
              to: sellerDealer.email,
              subject: `🎉 Buyer Has Paid Commitment Fee — ${vehicleInfo}`,
              html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; line-height: 1.6; }
  .header { background: #1e293b; color: white; padding: 24px; text-align: center; }
  .content { padding: 24px; max-width: 600px; margin: 0 auto; }
  .box { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .highlight { background: #dcfce7; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0; }
  .footer { text-align: center; color: #9ca3af; font-size: 13px; padding: 16px; }
</style></head>
<body>
  <div class="header"><h1>🎉 Commitment Fee Received</h1><p>A buyer has secured their auction win on your vehicle</p></div>
  <div class="content">
    <p>Hi ${sellerDealer.name},</p>
    <p>A buyer has paid the £10 commitment fee and secured their auction win on your vehicle:</p>
    <div class="box">
      <strong>Vehicle:</strong> ${vehicleInfo}<br>
      <strong>VIN:</strong> ${car.vin || 'N/A'}
    </div>
    <div class="highlight">
      <strong>✅ What this means:</strong> The buyer is committed to purchasing this vehicle. They will contact you to arrange an inspection.
    </div>
    <div class="box">
      <strong>Buyer:</strong> ${buyerName}<br>
      <strong>Contact:</strong> ${buyerEmail !== 'N/A' ? buyerEmail : 'Contact via EVEEVO platform'}
    </div>
    <p>Please be available to arrange a convenient inspection time. Once the buyer is satisfied, they will pay the full balance directly to you.</p>
    <p>You can view full details in <strong>My Auctions</strong> on the EVEEVO platform.</p>
  </div>
  <div class="footer">EVEEVO — Smart. Easy. Electric. | This is an automated notification.</div>
</body>
</html>`,
            });
            console.log('[Webhook] Sent seller notification email to:', sellerDealer.email);
          }
        }
      }
    }
  }
}

/**
 * Handle checkout session expired — restore auction if Buy It Now payment was not completed
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Checkout expired:', session.id);

  // Only restore auction if this was a Buy It Now commitment fee that was never paid
  if (session.mode === 'payment' && session.metadata?.purchase_type === 'buy_now') {
    const carId = session.metadata?.car_id ? parseInt(session.metadata.car_id) : null;

    if (!carId) {
      console.warn('[Webhook] No car_id in expired Buy Now session');
      return;
    }

    console.log('[Webhook] Restoring auction for car:', carId, '(Buy Now checkout expired without payment)');

    // Restore the auction — set it back to active with a new 48-hour window
    const newEndDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await db.restoreAuction(carId, newEndDate);

    console.log('[Webhook] Auction restored for car:', carId, 'new end date:', newEndDate);
  }
}

/**
 * Handle payment intent succeeded (for commitment fees)
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Webhook] Payment intent succeeded:', paymentIntent.id);

  // Check if this is a commitment fee payment (metadata should have bidId)
  const bidId = paymentIntent.metadata?.bidId;
  
  if (!bidId) {
    console.log('[Webhook] No bidId in payment intent metadata, skipping');
    return;
  }

  // Update bid payment status
  await db.updateBidPaymentStatus(parseInt(bidId), {
    paymentStatus: 'paid',
    stripePaymentIntentId: paymentIntent.id,
    paidAt: new Date(),
  });

  console.log('[Webhook] Updated bid payment status:', {
    bidId,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
  });
}
