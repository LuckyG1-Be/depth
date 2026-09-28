import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new Error("STRIPE_NOT_CONFIGURED");
  client ??= new Stripe(secret);
  return client;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PLUS_PRICE_ID && process.env.APP_URL);
}

export function isPlusStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}
