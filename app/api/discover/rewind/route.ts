import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rateLimitOrNull } from "@/lib/security";
import { dayKeyBrussels } from "@/lib/dayKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const rl = await rateLimitOrNull({ key: "discover_rewind", limit: 30, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const userId = session.user.id;
  const key = dayKeyBrussels();

  const last = await prisma.seenProfile.findFirst({
    where: { userId, dayKey: key },
    orderBy: { createdAt: "desc" },
    select: { id: true, seenUserId: true },
  });

  if (!last) return NextResponse.json({ ok: false, error: "NOTHING_TO_REWIND" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.seenProfile.delete({ where: { id: last.id } });

    // ✅ No composite unique assumed; use findFirst + update by id
    const quota = await tx.dailyQuota.findFirst({
      where: { userId, dayKey: key },
      select: { id: true, seenUsed: true },
    });

    if (quota) {
      await tx.dailyQuota.update({
        where: { id: quota.id },
        data: { seenUsed: Math.max(0, quota.seenUsed - 1) },
      });
    }
  });

  return NextResponse.json({ ok: true, rewoundUserId: last.seenUserId });
}
