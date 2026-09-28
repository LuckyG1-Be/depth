import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";
import { ensureDailyQuota, consumeLike } from "@/lib/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TxOut =
  | { ok: true; matchCreated: boolean }
  | { ok: false; error: "LIKE_LIMIT" | "FAILED" | "INVALID" | "MISSING" };

function isP2002(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 8_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const ip = getClientIp(req);
  const rl = await rateLimitOrNull({
    key: `discover_like:${userId}:${ip}`,
    limit: 120,
    windowMs: 60_000,
    message: "Te snel.",
  });
  if (rl) return rl;

  const body = (await req.json().catch(() => null)) as null | { otherUserId?: string };
  const otherUserId = String(body?.otherUserId || "").trim();

  if (!otherUserId) return NextResponse.json({ ok: false, error: "MISSING" }, { status: 400 });
  if (otherUserId === userId) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!target) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  // block safety
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: userId, blockedId: otherUserId }, { blockerId: otherUserId, blockedId: userId }] },
    select: { id: true },
  });
  if (blocked) return NextResponse.json({ ok: false, error: "BLOCKED" }, { status: 403 });

  const [a, b] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

  const out: TxOut = await prisma.$transaction(async (tx) => {
    // ✅ ensure quota row exists + enforce daily like cap
    const q = await ensureDailyQuota(tx, userId);
    const likeRes = await consumeLike(tx, userId, 1);
    if (!likeRes.ok) return { ok: false, error: likeRes.error };

    // mark as seen today (idempotent)
    try {
      await tx.seenProfile.create({ data: { userId, seenUserId: otherUserId, dayKey: q.dk } });
    } catch (e) {
      if (!isP2002(e)) throw e;
    }

    // store like
    await tx.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: otherUserId } },
      create: { fromUserId: userId, toUserId: otherUserId, type: "LIKE" },
      update: { type: "LIKE" },
    });

    // check reciprocal like/superlike => create match
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
        try {
          await tx.match.create({
            data: {
              userAId: a,
              userBId: b,
              isUnlocked: false,
              superlikeFromId: back.type === "SUPERLIKE" ? otherUserId : null,
            },
          });
          matchCreated = true;
        } catch (e) {
          if (!isP2002(e)) throw e;
        }
      }
    }

    return { ok: true, matchCreated };
  });

  if (!out.ok) {
    if (out.error === "LIKE_LIMIT") return NextResponse.json({ ok: false, error: "LIKE_LIMIT" }, { status: 429 });
    return NextResponse.json({ ok: false, error: out.error || "FAILED" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, matchCreated: out.matchCreated });
}
