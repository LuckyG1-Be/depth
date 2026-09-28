import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withTx } from "@/lib/dbTx";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";
import { logSecurityEvent } from "@/lib/security/risk";
import { isBlockedEitherWay } from "@/lib/safety/blocks";
import { moderateChatText } from "@/lib/safety/chatModeration";
import { ensureArchivedIfInactive } from "@/lib/chat/archive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMeaningful(text: string) {
  const t = (text || "").trim();
  if (t.length < 3) return false;
  return /[A-Za-z0-9À-ÖØ-öø-ÿ]/.test(t);
}

function normalizeForRepeat(text: string) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

async function isRepeatedText(matchId: string, fromUserId: string, text: string) {
  const norm = normalizeForRepeat(text);
  if (norm.length < 6) return false;

  const recent = await prisma.message.findMany({
    where: { matchId, fromUserId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { text: true, createdAt: true },
  });

  for (const m of recent) {
    const ageMs = Date.now() - new Date(m.createdAt).getTime();
    if (ageMs > 10 * 60 * 1000) continue; // last 10 minutes
    if (normalizeForRepeat(m.text) === norm) return true;
  }

  return false;
}

function countAlternations(senderIds: string[]) {
  let alternations = 0;
  for (let i = 1; i < senderIds.length; i++) {
    if (senderIds[i] !== senderIds[i - 1]) alternations++;
  }
  return alternations;
}

async function computeUnlock(matchId: string) {
  const all = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
    select: { fromUserId: true, text: true },
  });

  const meaningfulSenderIds = all.filter((m) => isMeaningful(m.text)).map((m) => m.fromUserId);
  const alternations = countAlternations(meaningfulSenderIds);
  const remaining = Math.max(0, 4 - alternations);

  return { alternations, remaining };
}

function strikeBanMs(strikes: number) {
  if (strikes >= 3) return 72 * 60 * 60 * 1000; // 72h
  if (strikes >= 2) return 24 * 60 * 60 * 1000; // 24h
  return 0;
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 20_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const ip = getClientIp(req);
  const rl = await rateLimitOrNull({
    key: `chat_send_ip:${ip}:${userId}`,
    limit: 120,
    windowMs: 60_000,
    message: "Te snel. Probeer zo opnieuw.",
  });
  if (rl) return rl;

  const body = (await req.json().catch(() => null)) as null | { matchId?: string; text?: string };
  const matchId = (body?.matchId || "").trim();
  const rawText = (body?.text || "").trim();

  if (!matchId) return NextResponse.json({ ok: false, error: "MISSING_MATCH" }, { status: 400 });
  if (!rawText) return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });
  if (rawText.length > 1500) return NextResponse.json({ ok: false, error: "TOO_LONG" }, { status: 400 });

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, userAId: true, userBId: true, isUnlocked: true, unlockedAt: true, isArchived: true, archivedAt: true },
  });
  if (!match) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (match.userAId !== userId && match.userBId !== userId) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  // Auto-archive check; archived chats become read-only
  const archivedState = await ensureArchivedIfInactive(matchId);
  const isArchived = match.isArchived || archivedState.isArchived;
  if (isArchived) {
    return NextResponse.json({ ok: false, error: "ARCHIVED" }, { status: 403 });
  }

  const otherUserId = match.userAId === userId ? match.userBId : match.userAId;

  // ✅ repeated text detection (jouw enige extra wens)
  if (await isRepeatedText(matchId, userId, rawText)) {
    await logSecurityEvent({
      userId,
      type: "CHAT_REPEAT_TEXT",
      severity: 2,
      scoreDelta: 2,
      req,
      meta: { matchId, len: rawText.length },
    }).catch(() => null);

    return NextResponse.json({ ok: false, error: "REPEATED" }, { status: 429 });
  }

  // chat ban enforcement
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { chatBannedUntil: true },
  });

  if (me?.chatBannedUntil && new Date(me.chatBannedUntil).getTime() > Date.now()) {
    return NextResponse.json({ ok: false, error: "CHAT_BANNED" }, { status: 403 });
  }

  // silent block enforcement
  if (await isBlockedEitherWay(userId, otherUserId)) {
    return NextResponse.json({ ok: false, error: "BLOCKED" }, { status: 403 });
  }

  // moderation (+ link neutralize pre-unlock + PII control)
  const decision = moderateChatText({ text: rawText, isUnlocked: match.isUnlocked });

  if (decision.action !== "ALLOW") {
    const severity = decision.action === "HARD_BLOCK" ? 6 : 3;
    const scoreDelta = decision.action === "HARD_BLOCK" ? 3 : 1;

    const strikeCode = decision.action === "HARD_BLOCK" ? "CHAT_HARD_BLOCK" : "CHAT_SOFT_BLOCK";

    const now = Date.now();
    const since = new Date(now - 24 * 60 * 60 * 1000);

    const strikes = await withTx(async (tx) => {
      await tx.accountFlag.create({
        data: {
          userId,
          code: strikeCode,
          reason: `match:${matchId}:cats:${decision.categories.join(",")}`,
        },
      });

      const count = await tx.accountFlag.count({
        where: {
          userId,
          createdAt: { gte: since },
          code: { in: ["CHAT_HARD_BLOCK", "CHAT_SOFT_BLOCK"] },
        },
      });

      const banMs = strikeBanMs(count);
      if (banMs > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { chatBannedUntil: new Date(now + banMs) },
        });
      }

      return count;
    });

    await logSecurityEvent({
      userId,
      type: "MESSAGE_BLOCKED",
      severity,
      scoreDelta,
      req,
      meta: { matchId, categories: decision.categories, action: decision.action, strikes24h: strikes },
    }).catch(() => null);

    return NextResponse.json(
      { ok: false, error: decision.messageForUser || "MESSAGE_BLOCKED", categories: decision.categories, strikes24h: strikes },
      { status: decision.action === "HARD_BLOCK" ? 403 : 400 }
    );
  }

  // per-match limiter (anti flooding)
  const matchRl = await rateLimitOrNull({
    key: `chat_send_match:${matchId}:${userId}`,
    limit: 30,
    windowMs: 60_000,
    message: "Te veel berichten na elkaar. Rustig aan.",
  });
  if (matchRl) return matchRl;

  const text = decision.sanitizedText;

  const created = await prisma.message.create({
    data: { matchId, fromUserId: userId, toUserId: otherUserId, text, isRead: false, readAt: null },
    select: { id: true, fromUserId: true, toUserId: true, text: true, createdAt: true, isRead: true, readAt: true },
  });

  const unlockInfo = await computeUnlock(matchId);

  let isUnlocked = match.isUnlocked;

  if (!isUnlocked && unlockInfo.alternations >= 4) {
    await prisma.match.update({
      where: { id: matchId },
      data: { isUnlocked: true, unlockedAt: new Date() },
    });
    isUnlocked = true;

    await logSecurityEvent({
      userId,
      type: "PHOTOS_UNLOCK",
      severity: 2,
      scoreDelta: 0,
      req,
      meta: { matchId, alternations: unlockInfo.alternations },
    }).catch(() => null);
  }

  await logSecurityEvent({
    userId,
    type: "MESSAGE_SEND",
    severity: 1,
    scoreDelta: 0,
    req,
    meta: { matchId, textLen: text.length, unlocked: isUnlocked },
  }).catch(() => null);

  return NextResponse.json({
    ok: true,
    message: {
      ...created,
      createdAt: created.createdAt.toISOString(),
      readAt: created.readAt ? created.readAt.toISOString() : null,
    },
    unlock: { isUnlocked, remaining: unlockInfo.remaining, alternations: unlockInfo.alternations },
  });
}
