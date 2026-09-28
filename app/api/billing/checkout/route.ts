import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  if (!stripeConfigured()) return NextResponse.json({ ok: false, error: "BILLING_NOT_CONFIGURED" }, { status: 503 });

  try {
    const stripe = getStripe();
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, name: true, subscription: true } });
    if (!user) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { userId: user.id } });
      customerId = customer.id;
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PLUS_PRICE_ID!, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${process.env.APP_URL}/plus?checkout=success`,
      cancel_url: `${process.env.APP_URL}/plus?checkout=cancelled`,
    });

    return NextResponse.json({ ok: true, url: checkout.url });
  } catch (error) {
    console.error("Stripe checkout failed", error);
    return NextResponse.json({ ok: false, error: "CHECKOUT_FAILED" }, { status: 502 });
  }
}
