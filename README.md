# 🛒 E-Commerce Website

A modern responsive e-commerce web application that allows users to browse products, add items to cart, and complete purchases.

## 🚀 Features

- Product listing page
- Product detail view
- Shopping cart functionality
- Checkout system
- Responsive design (mobile-friendly)
- User authentication (if implemented)
- Admin panel (if implemented)

## 🛠 Tech Stack

Frontend:
- HTML
- CSS
- JavaScript

Backend (if used):
- Node.js / Express
- MongoDB / MySQL

Payments:
- Stripe (Payment Processing API)

Stripe + Vercel setup for the subscription page:
- Create three Stripe recurring Prices for the monthly, quarterly, and yearly plans.
- Set these environment variables in Vercel: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_QUARTERLY`, and `STRIPE_PRICE_ID_YEARLY`.
- Optional: set `SITE_URL` to your production domain so Stripe success and cancel URLs resolve correctly.
- Vercel will run the serverless checkout endpoint in `api/create-checkout-session.js`, and the checkout page will redirect customers to Stripe-hosted subscription checkout.
- No separate backend server is required.

Resend email setup:
- Create a Resend account and verify your domain.
- Add these environment variables in Vercel: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SUPPORT_TO_EMAIL`.
- A good default is `RESEND_FROM_EMAIL=support@justincaseimdead.com` and `SUPPORT_TO_EMAIL=justincaseimdead@gmail.com` while you are getting the domain verified.
- Use the serverless endpoint in `api/send-support-email.js` to send support emails from a contact form or admin workflow.

Tracking incoming orders in Neon:
- Add `DATABASE_URL` in Vercel (from Neon connection string).
- Add `STRIPE_WEBHOOK_SECRET` in Vercel (from Stripe webhook endpoint signing secret).
- Create this table in Neon SQL editor:

```sql
CREATE TABLE IF NOT EXISTS subscription_orders (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	stripe_event_id TEXT NOT NULL UNIQUE,
	stripe_event_type TEXT NOT NULL,
	stripe_customer_id TEXT,
	stripe_subscription_id TEXT,
	stripe_session_id TEXT,
	customer_email TEXT,
	customer_name TEXT,
	plan_key TEXT,
	plan_name TEXT,
	status TEXT,
	amount_total INTEGER,
	currency TEXT,
	event_payload JSONB NOT NULL
);
```

To audit subscriber emails, create this table in the same Neon database and set `EMAIL_HISTORY_SECRET` in Vercel:

```sql
CREATE TABLE IF NOT EXISTS sent_emails (
	id BIGSERIAL PRIMARY KEY,
	sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	stripe_customer_id TEXT NOT NULL,
	recipient_email TEXT NOT NULL,
	email_key TEXT NOT NULL,
	subject TEXT NOT NULL,
	resend_id TEXT
);

CREATE INDEX IF NOT EXISTS sent_emails_recipient_email_idx
	ON sent_emails (LOWER(recipient_email), sent_at DESC);
```

After setup, query a user's history with:
`GET /api/email-history?email=user@example.com` and the header `Authorization: Bearer $EMAIL_HISTORY_SECRET`.

Stripe webhook setup:
- In Stripe dashboard, create webhook endpoint: `https://your-domain.com/api/stripe-webhook`.
- Subscribe to events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET` in Vercel.
- Redeploy Vercel after adding env vars.
- New Stripe events will be stored in Neon table `subscription_orders`.

Vercel setup:
- Import the repository into Vercel as a static site.
- Keep `vercel.json` in the project root so `/`, `/subscriptions`, and `/checkout` resolve to the existing HTML pages.
- Add the custom domain in Vercel if you want to use `justincaseimdead.com` there instead of the current hosting setup.
- No build command is required for the current HTML/CSS/JS-only site.

## 📦 Installation

1. Clone the repository
2. Install dependencies (if backend exists):