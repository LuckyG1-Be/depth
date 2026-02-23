// lib/chat/archive.ts
import { prisma } from "@/lib/db";

const INACTIVITY_DAYS = 15;

export function inactivityCutoffDate(now = new Date()) {
  return new Date(now.getTime() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
}

export async function getLastActivityAt(matchId: string) {
  const lastMsg = await prisma.message.findFirst({
    where: { matchId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (lastMsg?.createdAt) return lastMsg.createdAt;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { createdAt: true },
  });

  return match?.createdAt ?? null;
}

/**
 * If there was no activity (no messages) for 15 days, archive the match.
 * Returns the *current* archived state.
 */
export async function ensureArchivedIfInactive(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, isArchived: true, archivedAt: true, createdAt: true },
  });
  if (!match) return { isArchived: false, archivedAt: null };

  if (match.isArchived) {
    return { isArchived: true, archivedAt: match.archivedAt };
  }

  const lastAt = await getLastActivityAt(matchId);
  const cutoff = inactivityCutoffDate();

  if (lastAt && lastAt < cutoff) {
    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { isArchived: true, archivedAt: new Date() },
      select: { isArchived: true, archivedAt: true },
    });
    return { isArchived: updated.isArchived, archivedAt: updated.archivedAt };
  }

  return { isArchived: false, archivedAt: null };
}