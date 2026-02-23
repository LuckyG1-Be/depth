import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { neutralizeLinksForDisplay } from "@/lib/safety/chatModeration";
import { rateLimitOrNull, getClientIp } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(s: string | null | undefined, fallback = "") {
  return (s ?? fallback).toString();
}

function clampText(s: string | null | undefined, max = 500) {
  const v = safe(s, "");
  if (v.length <= max) return v;
  return v.slice(0, max) + "…";
}

type UnreadGroup = { matchId: string; _count: { _all: number } };

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTH", items: [], archivedItems: [] }, { status: 401 });
    }

    const userId = session.user.id;

    const ip = getClientIp(req);
    const rl = await rateLimitOrNull({ key: `chat_threads:${userId}:${ip}`, limit: 90, windowMs: 60_000, message: "Te snel." });
    if (rl) return rl;

    // Hide threads with blocked users (link-safe & trust-safe)
    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set<string>();
    for (const b of blocks) {
      blockedIds.add(b.blockerId);
      blockedIds.add(b.blockedId);
    }

    // ✅ include BOTH active + archived; split later
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: {
        id: true,
        isUnlocked: true,
        unlockedAt: true,
        isArchived: true,
        archivedAt: true,

        userAId: true,
        userBId: true,
        userA: {
          select: {
            id: true,
            name: true,
            city: true,
            photos: { take: 1, orderBy: { slot: "asc" }, select: { id: true } },
          },
        },
        userB: {
          select: {
            id: true,
            name: true,
            city: true,
            photos: { take: 1, orderBy: { slot: "asc" }, select: { id: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fromUserId: true,
            text: true,
            createdAt: true,
          },
        },
        _count: { select: { messages: true } },
      },
    });

    // ✅ unread per match (includes archived too; UI can choose what to do)
    const unread = (await prisma.message.groupBy({
      by: ["matchId"],
      where: { toUserId: userId, isRead: false },
      _count: { _all: true },
    })) as unknown as UnreadGroup[];

    const unreadMap = new Map<string, number>(unread.map((u) => [u.matchId, u._count._all]));

    const mapped = matches
      .filter((m) => {
        const otherId = m.userAId === userId ? m.userBId : m.userAId;
        return !blockedIds.has(otherId);
      })
      .map((m) => {
        const other = m.userAId === userId ? m.userB : m.userA;
        const last = m.messages[0] ?? null;

        const otherFirstPhotoId = m.isUnlocked ? other?.photos?.[0]?.id ?? null : null;

        const raw = last ? clampText(last.text ?? "", 500) : null;
        const lastMessageText = raw ? neutralizeLinksForDisplay(raw, m.isUnlocked) : null;

        return {
          matchId: m.id,

          otherUserId: other?.id ?? "",
          otherName: safe(other?.name, "Onbekend"),
          otherCity: safe(other?.city, ""),
          otherFirstPhotoId,

          isUnlocked: m.isUnlocked,
          unlockedAt: m.unlockedAt ? m.unlockedAt.toISOString() : null,

          isArchived: m.isArchived,
          archivedAt: m.archivedAt ? m.archivedAt.toISOString() : null,

          lastMessageText,
          lastMessageAt: last?.createdAt ? last.createdAt.toISOString() : null,
          lastMessageFromOther: last ? last.fromUserId !== userId : false,

          unreadCount: unreadMap.get(m.id) ?? 0,
          hasMessages: (m._count?.messages ?? 0) > 0,
        };
      });

    const sortByLast = (a: any, b: any) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    };

    const items = mapped.filter((x) => !x.isArchived).sort(sortByLast);
    const archivedItems = mapped.filter((x) => x.isArchived).sort(sortByLast);

    const res = NextResponse.json({ ok: true, items, archivedItems });
    res.headers.set("cache-control", "no-store");
    return res;
  } catch (e: any) {
    console.error("GET /api/chat/threads failed:", e);
    return NextResponse.json({ ok: false, error: e?.message || "THREADS_FAILED", items: [], archivedItems: [] }, { status: 500 });
  }
}