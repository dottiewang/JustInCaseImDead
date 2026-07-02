const Stripe = require('stripe');

const planMap = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY,
    plan: 'Premium Plan - Monthly',
  },
  quarterly: {
    priceId: process.env.STRIPE_PRICE_ID_QUARTERLY,
    plan: 'Premium Plan - Quarterly',
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_ID_YEARLY,
    plan: 'Premium Plan - Yearly',
  },
};

function getBaseUrl(req) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  const host = forwardedHost || req.headers.host;
  return `${forwardedProto}://${host}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY environment variable.' });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (error) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const planKey = body.planKey || 'monthly';
  const selectedPlan = planMap[planKey];

  if (!selectedPlan || !selectedPlan.priceId) {
    return res.status(400).json({ error: `Missing Stripe price ID for plan: ${planKey}.` });
  }

  const baseUrl = process.env.SITE_URL || getBaseUrl(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/checkout?success=1&planKey=${encodeURIComponent(planKey)}`,
      cancel_url: `${baseUrl}/checkout?canceled=1&planKey=${encodeURIComponent(planKey)}`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          planKey,
          plan: selectedPlan.plan,
        },
      },
      metadata: {
        planKey,
        plan: selectedPlan.plan,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to create Stripe checkout session.',
    });
  }
};