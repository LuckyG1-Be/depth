import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rateLimitOrNull } from "@/lib/security";
import { dayKeyBrussels } from "@/lib/dayKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const rl = await rateLimitOrNull({ key: "discover_reset_today", limit: 10, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const key = dayKeyBrussels();

  await prisma.seenProfile.deleteMany({
    where: { userId: session.user.id, dayKey: key },
  });

  return NextResponse.json({ ok: true });
}
