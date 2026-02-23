import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ count: 0 }, { status: 200 });

  const userId = session.user.id;

  // Exclude blocked users from like count (optional but recommended)
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });

  const blockedIds = new Set<string>();
  for (const b of blocks) {
    blockedIds.add(b.blockerId);
    blockedIds.add(b.blockedId);
  }
  blockedIds.delete(userId);

  // Build a set of users that are already matched with me
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { userAId: true, userBId: true },
  });

  const matchedIds = new Set<string>();
  for (const m of matches) {
    const other = m.userAId === userId ? m.userBId : m.userAId;
    matchedIds.add(other);
  }

  const exclude = Array.from(new Set([...matchedIds, ...blockedIds]));

  // Count ONLY likes that are not converted to a match yet
  const count = await prisma.like.count({
    where: {
      toUserId: userId,
      ...(exclude.length ? { fromUserId: { notIn: exclude } } : {}),
    },
  });

  const res = NextResponse.json({ count });
  res.headers.set("cache-control", "no-store");
  return res;
}
