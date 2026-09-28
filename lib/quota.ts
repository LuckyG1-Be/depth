// lib/quota.ts
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { dayKeyBrussels } from "@/lib/dayKey";

export const DAILY_SEEN_LIMIT = 20;
export const DAILY_LIKE_LIMIT = 20;
export const SEEN_RETENTION_DAYS = 45;

/**
 * Prisma calls may come from:
 * - prisma (PrismaClient)
 * - tx (Prisma.TransactionClient) inside prisma.$transaction
 */
export type DbClient = PrismaClient | Prisma.TransactionClient;

export type DailyQuotaRow = {
  dayKey: string;
  likesUsed: number;
  seenUsed: number;
  superlikeUsedAt: Date | null;
};

/** Delete old SeenProfile rows for this user (keeps table small & fast). */
export async function pruneSeenProfiles(db: DbClient, userId: string, retentionDays = SEEN_RETENTION_DAYS) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  await db.seenProfile.deleteMany({
    where: { userId, createdAt: { lt: cutoff } },
  });
}

/**
 * Ensure a DailyQuota row exists and is aligned with today (Brussels dayKey).
 * When the day rolls over, counters reset.
 */
export async function ensureDailyQuota(db: DbClient, userId: string): Promise<DailyQuotaRow & { dk: string }> {
  const dk = dayKeyBrussels();

  const existing = await db.dailyQuota.findUnique({
    where: { userId },
    select: { dayKey: true, likesUsed: true, seenUsed: true, superlikeUsedAt: true },
  });

  if (!existing) {
    const created = await db.dailyQuota.create({
      data: { userId, dayKey: dk, likesUsed: 0, seenUsed: 0, superlikeUsedAt: null },
      select: { dayKey: true, likesUsed: true, seenUsed: true, superlikeUsedAt: true },
    });

    // keep table healthy from day 1 (best-effort)
    await pruneSeenProfiles(db, userId).catch(() => null);

    return { ...created, dk };
  }

  if (existing.dayKey !== dk) {
    const updated = await db.dailyQuota.update({
      where: { userId },
      data: { dayKey: dk, likesUsed: 0, seenUsed: 0, superlikeUsedAt: null },
      select: { dayKey: true, likesUsed: true, seenUsed: true, superlikeUsedAt: true },
    });

    // day rollover is a good moment to prune
    await pruneSeenProfiles(db, userId).catch(() => null);

    return { ...updated, dk };
  }

  return { ...existing, dk };
}

export function canUseWeeklySuperlike(last: Date | null) {
  if (!last) return true;
  return Date.now() - new Date(last).getTime() >= 7 * 24 * 60 * 60 * 1000;
}

/**
 * Consume N "seen" units in a transaction-safe way.
 * Returns how many were actually consumed (0..n), considering the daily cap.
 */
export async function consumeSeen(db: DbClient, userId: string, n: number) {
  if (n <= 0) return 0;

  const q = await ensureDailyQuota(db, userId);
  const remaining = Math.max(0, DAILY_SEEN_LIMIT - q.seenUsed);
  const take = Math.min(remaining, n);
  if (take <= 0) return 0;

  await db.dailyQuota.update({
    where: { userId },
    data: { seenUsed: { increment: take } },
  });

  return take;
}

/**
 * Consume N likes with daily cap.
 * Returns { ok: true } or { ok:false, error:"LIKE_LIMIT" }.
 */
export async function consumeLike(db: DbClient, userId: string, inc = 1) {
  if (inc <= 0) return { ok: true as const };

  const q = await ensureDailyQuota(db, userId);
  const remaining = Math.max(0, DAILY_LIKE_LIMIT - q.likesUsed);
  if (remaining < inc) {
    return { ok: false as const, error: "LIKE_LIMIT" as const };
  }

  await db.dailyQuota.update({
    where: { userId },
    data: { likesUsed: { increment: inc } },
  });

  return { ok: true as const };
}
