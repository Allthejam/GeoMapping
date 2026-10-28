import { NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/init';

/**
 * @fileOverview Finalized PayPal Webhook Handler
 * Processes subscriptions, sale completions, and security reversals.
 */

export async function POST(req: Request) {
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = payload.event_type;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  console.log(`[PayPal Webhook] Received ${eventType}. Verifying with ID: ${webhookId ? 'Present' : 'Missing'}`);

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

    switch (eventType) {
      // SUCCESSFUL PAYMENT / ACTIVATION
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'PAYMENT.SALE.COMPLETED':
      case 'CHECKOUT.ORDER.COMPLETED':
        console.log(`[PayPal Webhook] UPGRADING user ${userId} to Pro status.`);
        await updateDoc(userRef, {
          subscriptionStatus: 'pro',
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
    console.error('[PayPal Webhook] Critical Processing Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
