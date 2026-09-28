import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function syncSubscription(subscription: Stripe.Subscription, fallbackUserId?: string) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const metadataUserId = subscription.metadata?.userId || fallbackUserId;
  const existing = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId }, select: { userId: true } });
  const userId = existing?.userId || metadataUserId;
  if (!userId) return;

  const current = await prisma.subscription.findFirst({
    where: { OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }, { userId }] },
    select: { id: true },
  });
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const data = {
      stripeCustomerId: customerId,
      userId,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id || null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeSubscriptionId: subscription.id,
  };
  if (current) await prisma.subscription.update({ where: { id: current.id }, data });
  else await prisma.subscription.create({ data });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false, error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ ok: false, error: "MISSING_SIGNATURE" }, { status: 400 });

  try {
    const event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object as Stripe.Checkout.Session;
      if (checkout.mode === "subscription" && checkout.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(String(checkout.subscription));
        await syncSubscription(subscription, checkout.metadata?.userId);
      }
    }
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook failed", error);
    return NextResponse.json({ ok: false, error: "INVALID_WEBHOOK" }, { status: 400 });
  }
}
