import { prisma } from "@/lib/db";

export async function isBlockedEitherWay(userId: string, otherUserId: string): Promise<boolean> {
  if (!userId || !otherUserId) return false;
  if (userId === otherUserId) return false;

  const hit = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
    select: { id: true },
  });

  return Boolean(hit);
}

export async function getBlockedUserIdsFor(userId: string): Promise<Set<string>> {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });

  const out = new Set<string>();
  for (const r of rows) {
    if (r.blockerId === userId) out.add(r.blockedId);
    if (r.blockedId === userId) out.add(r.blockerId);
  }
  return out;
}

export async function createSilentBlock(args: { blockerId: string; blockedId: string; reason?: string | null }) {
  const { blockerId, blockedId, reason } = args;

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: { reason: reason ?? undefined },
    create: { blockerId, blockedId, reason: reason ?? undefined },
  });
}