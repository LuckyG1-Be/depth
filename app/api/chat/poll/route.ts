import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { neutralizeLinksForDisplay } from "@/lib/safety/chatModeration";
import { ensureArchivedIfInactive } from "@/lib/chat/archive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: Date;
  isRead: boolean;
  readAt: Date | null;
};

function isMeaningful(text: string) {
  const t = (text || "").trim();
  if (t.length < 3) return false;
  return /[A-Za-z0-9À-ÖØ-öø-ÿ]/.test(t);
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const matchId = (url.searchParams.get("matchId") || "").trim();
  const mode = (url.searchParams.get("mode") || "latest").trim(); // latest | newer | older
  const limitRaw = Number(url.searchParams.get("limit") || "60");
  const limit = Number.isFinite(limitRaw) ? Math.max(10, Math.min(120, limitRaw)) : 60;

  const cursor = (url.searchParams.get("cursor") || "").trim(); // message id
  const after = (url.searchParams.get("after") || "").trim(); // message id

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  if (!matchId) return NextResponse.json({ ok: false, error: "MISSING_MATCH" }, { status: 400 });

  const meId = session.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, userAId: true, userBId: true, isUnlocked: true, isArchived: true, archivedAt: true },
  });
  if (!match) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (match.userAId !== meId && match.userBId !== meId) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  // Auto-archive if inactive
  const archivedState = await ensureArchivedIfInactive(matchId);
  const isArchived = match.isArchived || archivedState.isArchived;

  // Pagination
  let rows: ApiMessage[] = [];

  if (mode === "older") {
    if (!cursor) return NextResponse.json({ ok: false, error: "MISSING_CURSOR" }, { status: 400 });

    const c = await prisma.message.findUnique({ where: { id: cursor }, select: { id: true, createdAt: true } });
    if (!c) return NextResponse.json({ ok: false, error: "BAD_CURSOR" }, { status: 400 });

    rows = (await prisma.message.findMany({
      where: {
        matchId,
        OR: [{ createdAt: { lt: c.createdAt } }, { createdAt: c.createdAt, id: { lt: c.id } }],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        text: true,
        createdAt: true,
        isRead: true,
        readAt: true,
      },
    })) as ApiMessage[];
  } else if (mode === "newer") {
    if (!after) return NextResponse.json({ ok: false, error: "MISSING_AFTER" }, { status: 400 });

    const a = await prisma.message.findUnique({ where: { id: after }, select: { id: true, createdAt: true } });
    if (!a) return NextResponse.json({ ok: false, error: "BAD_AFTER" }, { status: 400 });

    rows = (await prisma.message.findMany({
      where: {
        matchId,
        OR: [{ createdAt: { gt: a.createdAt } }, { createdAt: a.createdAt, id: { gt: a.id } }],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        text: true,
        createdAt: true,
        isRead: true,
        readAt: true,
      },
    })) as ApiMessage[];
  } else {
    // latest
    rows = (await prisma.message.findMany({
      where: { matchId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        text: true,
        createdAt: true,
        isRead: true,
        readAt: true,
      },
    })) as ApiMessage[];
  }

  const nextCursor = rows.length > 0 ? rows[rows.length - 1].id : null;

  const mapped = rows.map((m) => ({
    ...m,
    text: neutralizeLinksForDisplay(m.text, match.isUnlocked),
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
  }));

  // For latest/older we return in chronological order (ASC)
  const messages = mode === "older" || mode === "latest" ? mapped.reverse() : mapped;

  const unlockInfo = await computeUnlock(matchId);

  return NextResponse.json({
    ok: true,
    isArchived,
    archivedAt: (match.archivedAt ?? archivedState.archivedAt) ? (match.archivedAt ?? archivedState.archivedAt)!.toISOString() : null,
    page: { mode, limit, nextCursor },
    messages,
    unlock: { isUnlocked: match.isUnlocked, remaining: unlockInfo.remaining, alternations: unlockInfo.alternations },
  });
}
