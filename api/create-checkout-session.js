const Stripe = require('stripe');

const planMap = {
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
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY environment variable.' });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });

  const planKey = req.method === 'GET'
    ? (req.query.planKey || 'yearly')
    : ((req.body && req.body.planKey) || 'yearly');
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
      success_url: `https://www.justincaseimdead.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=1&planKey=${encodeURIComponent(planKey)}`,
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
      consent_collection: { terms_of_service: 'required' },
      custom_text: {
        terms_of_service_acceptance: {
          message: 'I agree to the [Terms](https://www.justincaseimdead.com/terms) and [Privacy Policy](https://www.justincaseimdead.com/privacy-policy), and I understand my plan renews automatically at the price shown, every quarter or year as chosen, until I cancel. I can cancel anytime from the link in any email.',
        },
      },
    });

    if (req.method === 'GET') {
      return res.redirect(303, session.url);
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to create Stripe checkout session.',
    });
  }
};