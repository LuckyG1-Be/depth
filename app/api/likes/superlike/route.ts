import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";
import { dayKeyBrussels } from "@/lib/dayKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 20_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "superlike", limit: 30, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const userId = session.user.id;

  const form = await req.formData();
  const otherUserId = String(form.get("otherUserId") || "").trim();

  if (!otherUserId || otherUserId === userId) {
    return NextResponse.redirect(new URL("/discover", req.url), 303);
  }

  // 1 superlike per week
  const last = await prisma.dailyQuota.findFirst({
    where: { userId, superlikeUsedAt: { not: null } },
    orderBy: { superlikeUsedAt: "desc" },
    select: { superlikeUsedAt: true },
  });

  if (last?.superlikeUsedAt) {
    const delta = Date.now() - new Date(last.superlikeUsedAt).getTime();
    if (delta < 7 * 24 * 60 * 60 * 1000) {
      return NextResponse.redirect(new URL("/discover?err=superlike_limit", req.url), 303);
    }
  }

  // 20 profielen/dag: superlike telt mee als "gezien"
  const key = dayKeyBrussels();
  const SEEN_LIMIT = 20;

  const seenCount = await prisma.seenProfile.count({ where: { userId, dayKey: key } });
  const alreadySeen = await prisma.seenProfile.findFirst({
    where: { userId, dayKey: key, seenUserId: otherUserId },
    select: { id: true },
  });

  if (!alreadySeen && seenCount >= SEEN_LIMIT) {
    return NextResponse.redirect(new URL("/discover?err=seen_limit", req.url), 303);
  }

  await prisma.$transaction(async (tx) => {
    // markeer gezien
    await tx.seenProfile.upsert({
      where: { userId_seenUserId_dayKey: { userId, seenUserId: otherUserId, dayKey: key } },
      create: { userId, seenUserId: otherUserId, dayKey: key },
      update: {},
    });

    // quota updaten (superlikeUsedAt + seenUsed)
    const quota = await tx.dailyQuota.findFirst({
      where: { userId, dayKey: key },
      select: { id: true, seenUsed: true },
    });

    if (quota) {
      await tx.dailyQuota.update({
        where: { id: quota.id },
        data: {
          superlikeUsedAt: new Date(),
          seenUsed: alreadySeen ? quota.seenUsed : quota.seenUsed + 1,
        },
      });
    } else {
      await tx.dailyQuota.create({
        data: {
          userId,
          dayKey: key,
          seenUsed: alreadySeen ? 0 : 1,
          likesUsed: 0,
          superlikeUsedAt: new Date(),
        },
      });
    }

    // superlike upsert
    await tx.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: otherUserId } },
      create: { fromUserId: userId, toUserId: otherUserId, type: "SUPERLIKE" },
      update: { type: "SUPERLIKE" },
    });

    // mutual? => match
    const reverse = await tx.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: otherUserId, toUserId: userId } },
      select: { type: true },
    });

    if (reverse) {
      const a = userId < otherUserId ? userId : otherUserId;
      const b = userId < otherUserId ? otherUserId : userId;

      await tx.match.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        create: {
          userAId: a,
          userBId: b,
          isUnlocked: false,
          unlockedAt: null,
          superlikeFromId: userId, // ✅ superlike kwam van mij
        },
        update: {
          superlikeFromId: userId,
        },
      });
    }
  });

  return NextResponse.redirect(new URL("/discover", req.url), 303);
}
