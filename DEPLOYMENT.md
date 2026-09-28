# Self-hosted deployment

Depth can run without Vercel as a Docker container on a VPS or managed container host.

## Storage model

- The SQLite database is stored in the private `depth-data` volume.
- Processed photos and thumbnails are stored in the private `depth-uploads` volume.
- Neither volume is published as a static web directory.
- Photo access goes through authenticated `/api/photo/*` routes, which enforce ownership, block and match-unlock checks.
- Back up both volumes, and keep backup storage encrypted.

## First deployment

1. Copy `.env.production.example` to `.env.production`.
2. Replace `JWT_SECRET` with a long random value and configure email/SMS providers.
3. For Depth Plus, create a recurring Stripe Price and configure `STRIPE_SECRET_KEY`, `STRIPE_PLUS_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` and `APP_URL`.
4. Register `https://your-domain.example/api/billing/webhook` in Stripe for `checkout.session.completed` and `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`.
5. Put a TLS reverse proxy in front of port `3000` (Caddy or Nginx).
6. Run:

```bash
docker compose up -d --build
```

7. Verify `https://your-domain.example/api/health` returns `{ "ok": true }`.

## Stripe billing

- Checkout is created server-side; the secret key never reaches the browser.
- Subscription state is activated only after a signed Stripe webhook is received.
- Users manage cancellation and payment methods through Stripe Customer Portal.
- Keep the webhook endpoint behind HTTPS and use the signing secret from the same Stripe mode (test or live).
- Test the complete flow in Stripe test mode before switching the keys and Price ID to live mode.

## Operational requirements

- Do not expose port 3000 directly to the internet; expose only the TLS proxy.
- Restrict SSH and firewall access to the required ports.
- Back up `depth-data` and `depth-uploads` before upgrades.
- Rotate `JWT_SECRET` only with a planned session invalidation.
- For multi-instance production, move SQLite to PostgreSQL and the upload volume to private S3-compatible storage before scaling horizontally.
