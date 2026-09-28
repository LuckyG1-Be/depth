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

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id }, select: { stripeCustomerId: true } });
  if (!subscription) return NextResponse.json({ ok: false, error: "NO_SUBSCRIPTION" }, { status: 404 });

  try {
    const portal = await getStripe().billingPortal.sessions.create({ customer: subscription.stripeCustomerId, return_url: `${process.env.APP_URL}/plus` });
    return NextResponse.json({ ok: true, url: portal.url });
  } catch (error) {
    console.error("Stripe portal failed", error);
    return NextResponse.json({ ok: false, error: "PORTAL_FAILED" }, { status: 502 });
  }
}
