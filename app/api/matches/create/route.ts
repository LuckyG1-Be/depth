import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 12_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "match_create", limit: 60, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { otherUserId?: string };
  const otherUserId = String(body?.otherUserId || "").trim();
  if (!otherUserId) return NextResponse.json({ ok: false, error: "MISSING_OTHER" }, { status: 400 });

  const userId = session.user.id;
  if (otherUserId === userId) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  // Only create a match if mutual like exists
  const aLike = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId: otherUserId } },
    select: { id: true, type: true },
  });

  const bLike = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: otherUserId, toUserId: userId } },
    select: { id: true, type: true },
  });

  if (!aLike || !bLike) return NextResponse.json({ ok: false, error: "NOT_MUTUAL" }, { status: 400 });

  const userAId = userId < otherUserId ? userId : otherUserId;
  const userBId = userId < otherUserId ? otherUserId : userId;

  const superlikeFromId =
    aLike.type === "SUPERLIKE" ? userId : bLike.type === "SUPERLIKE" ? otherUserId : null;

  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId, isUnlocked: false, unlockedAt: null, superlikeFromId },
    update: { superlikeFromId },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, matchId: match.id });
}

