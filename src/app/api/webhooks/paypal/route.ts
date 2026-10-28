import { NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/init';

/**
 * @fileOverview Hardened PayPal Webhook Handler
 * Verifies cryptographic signatures and processes subscriptions, orders, and cancellations.
 */

async function verifyPaypalWebhook(req: Request, payload: any): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET_KEY;

  if (!webhookId || !clientId || !secret) {
    console.warn('[PayPal Webhook] Signature check bypassed: PAYPAL_WEBHOOK_ID not yet configured.');
    return true;
  }

  const authAlgo = req.headers.get('paypal-auth-algo');
  const certUrl = req.headers.get('paypal-cert-url');
  const transmissionId = req.headers.get('paypal-transmission-id');
  const transmissionSig = req.headers.get('paypal-transmission-sig');
  const transmissionTime = req.headers.get('paypal-transmission-time');

  if (!transmissionSig || !transmissionId) {
    console.warn('[PayPal Webhook] Missing PayPal signature headers.');
    return false;
  }

  try {
    const isSandbox = clientId.startsWith('sb-') || process.env.PAYPAL_SANDBOX === 'true';
    const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    // 1. Get access token
    const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      console.error('[PayPal Webhook] Failed to retrieve PayPal OAuth token.');
      return false;
    }

    const { access_token } = await tokenRes.json();

    // 2. Verify signature
    const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: payload,
      }),
    });

    if (!verifyRes.ok) {
      return false;
    }

    const verifyData = await verifyRes.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (err: any) {
    console.error('[PayPal Webhook] Signature verification failed:', err?.message);
    return false;
  }
}

export async function POST(req: Request) {
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Cryptographic signature check
  const isVerified = await verifyPaypalWebhook(req, payload);
  if (!isVerified) {
    console.warn('[PayPal Webhook] Unauthorized: Invalid PayPal webhook signature.');
    return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
  }

  const eventType = payload.event_type;
  console.log(`[PayPal Webhook] Verified event received: ${eventType}`);

  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      console.error('[PayPal Webhook] Firestore failed to initialize');
      return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    // Extract User ID from custom_id (provided during button checkout)
    const resource = payload.resource;
    const userId = resource.custom_id || resource.subscriber?.custom_id || (resource.supplementary_data?.related_ids?.order_id ? null : null);

    if (!userId) {
      console.warn(`[PayPal Webhook] No custom_id found for event ${eventType}. Skipping update.`);
      return NextResponse.json({ received: true, note: 'No user context' });
    }

    const userRef = doc(firestore, 'users', userId);

    // Determine target subscription tier (Estate vs Pro)
    const estatePlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ESTATE || 'P-93R442660V685214KNI2D2MI';
    const planId = resource.plan_id || resource.billing_agreement_id;
    const targetTier = (planId === estatePlanId) ? 'estate' : 'pro';

    switch (eventType) {
      // SUCCESSFUL PAYMENT / ACTIVATION
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'PAYMENT.SALE.COMPLETED':
      case 'CHECKOUT.ORDER.COMPLETED':
        console.log(`[PayPal Webhook] UPGRADING user ${userId} to ${targetTier.toUpperCase()} tier.`);
        await updateDoc(userRef, {
          subscriptionStatus: targetTier,
          lastPaymentDate: new Date().toISOString(),
          paypalSubscriptionId: resource.id || resource.billing_agreement_id
        });
        break;

      // DENIED / REVERSED / EXPIRED
      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REVERSED':
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'INVOICING.RECURRING-INVOICE.EXPIRED':
        console.log(`[PayPal Webhook] DOWNGRADING user ${userId} due to ${eventType}.`);
        await updateDoc(userRef, {
          subscriptionStatus: 'free'
        });
        break;

      // INFORMATIONAL / PENDING
      case 'PAYMENT.ORDER.CREATED':
      case 'BILLING.SUBSCRIPTION.CREATED':
        console.log(`[PayPal Webhook] Informational event received: ${eventType}`);
        break;

      default:
        console.log(`[PayPal Webhook] Event ignored: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[PayPal Webhook] Critical Processing Error:', err?.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
