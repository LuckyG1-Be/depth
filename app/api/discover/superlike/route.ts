import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";
import { ensureDailyQuota, consumeLike, canUseWeeklySuperlike } from "@/lib/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TxOut =
  | { ok: true; matchCreated: boolean }
  | { ok: false; error: "SUPERLIKE_LIMIT" | "LIKE_LIMIT" | "FAILED" | "INVALID" | "MISSING" };

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 8_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const ip = getClientIp(req);
  const rl = await rateLimitOrNull({
    key: `discover_superlike:${userId}:${ip}`,
    limit: 80,
    windowMs: 60_000,
    message: "Te snel.",
  });
  if (rl) return rl;

  const body = (await req.json().catch(() => null)) as null | { otherUserId?: string };
  const otherUserId = String(body?.otherUserId || "").trim();

  if (!otherUserId) return NextResponse.json({ ok: false, error: "MISSING" }, { status: 400 });
  if (otherUserId === userId) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  // block safety
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: userId, blockedId: otherUserId }, { blockerId: otherUserId, blockedId: userId }] },
    select: { id: true },
  });
  if (blocked) return NextResponse.json({ ok: false, error: "BLOCKED" }, { status: 403 });

  const [a, b] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

  const out: TxOut = await prisma.$transaction(async (tx) => {
    const q = await ensureDailyQuota(tx, userId);

    if (!canUseWeeklySuperlike(q.superlikeUsedAt ?? null)) {
      return { ok: false, error: "SUPERLIKE_LIMIT" };
    }

    const likeRes = await consumeLike(tx, userId, 1);
    if (!likeRes.ok) return { ok: false, error: likeRes.error };

    await tx.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: otherUserId } },
      create: { fromUserId: userId, toUserId: otherUserId, type: "SUPERLIKE" },
      update: { type: "SUPERLIKE" },
    });

    await tx.dailyQuota.update({
      where: { userId },
      data: { superlikeUsedAt: new Date() },
    });

    const back = await tx.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: otherUserId, toUserId: userId } },
      select: { type: true },
    });

    let matchCreated = false;

    if (back) {
      const existing = await tx.match.findFirst({
        where: { userAId: a, userBId: b },
        select: { id: true },
      });

      if (!existing) {
        await tx.match.create({
          data: {
            userAId: a,
            userBId: b,
            isUnlocked: false,
            superlikeFromId: userId,
          },
        });
        matchCreated = true;
      } else {
        // optional: keep track who superliked first
        await tx.match.update({ where: { id: existing.id }, data: { superlikeFromId: userId } }).catch(() => null);
      }
    }

    return { ok: true, matchCreated };
  });

  if (!out.ok) {
    if (out.error === "SUPERLIKE_LIMIT") return NextResponse.json({ ok: false, error: "SUPERLIKE_LIMIT" }, { status: 429 });
    if (out.error === "LIKE_LIMIT") return NextResponse.json({ ok: false, error: "LIKE_LIMIT" }, { status: 429 });
    return NextResponse.json({ ok: false, error: out.error || "FAILED" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, matchCreated: out.matchCreated });
}