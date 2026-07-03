const Stripe = require('stripe');
const db = require('../lib/db');

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

async function persistEvent(event) {
  const object = event.data && event.data.object ? event.data.object : {};
  const customerDetails = object.customer_details || {};
  const metadata = object.metadata || {};

  const stripeEventId = event.id;
  const stripeEventType = event.type;
  const stripeCustomerId = object.customer || null;
  const stripeSubscriptionId = object.subscription || null;
  const stripeSessionId = object.id || null;
  const customerEmail = customerDetails.email || object.customer_email || null;
  const customerName = customerDetails.name || null;
  const planKey = metadata.planKey || null;
  const planName = metadata.plan || null;
  const status = object.status || object.payment_status || null;
  const amountTotal = Number.isInteger(object.amount_total) ? object.amount_total : null;
  const currency = object.currency || null;
  const eventPayload = JSON.stringify(event);

  await db.query(
    `
      INSERT INTO subscription_orders (
        stripe_event_id,
        stripe_event_type,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_session_id,
        customer_email,
        customer_name,
        plan_key,
        plan_name,
        status,
        amount_total,
        currency,
        event_payload
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb
      )
      ON CONFLICT (stripe_event_id) DO NOTHING
    `,
    [
      stripeEventId,
      stripeEventType,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeSessionId,
      customerEmail,
      customerName,
      planKey,
      planName,
      status,
      amountTotal,
      currency,
      eventPayload,
    ]
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !stripeWebhookSecret) {
    return res.status(500).json({
      error: 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET environment variable.',
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });

  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature header.' });
  }

  try {
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);

    const supportedEvents = [
      'checkout.session.completed',
      'invoice.paid',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ];

    if (supportedEvents.includes(event.type)) {
      await persistEvent(event);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Webhook verification failed.',
    });
  }
};