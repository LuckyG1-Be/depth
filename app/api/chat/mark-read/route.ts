import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 5_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({
    key: "chat_mark_read",
    limit: 120,
    windowMs: 60_000,
    message: "Te snel. Probeer zo opnieuw.",
  });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const body = (await req.json().catch(() => null)) as null | { matchId?: string };
  const matchId = (body?.matchId || "").trim();
  if (!matchId) return NextResponse.json({ ok: false, error: "MISSING_MATCH" }, { status: 400 });

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { userAId: true, userBId: true },
  });
  if (!match) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (match.userAId !== userId && match.userBId !== userId) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const now = new Date();

  const result = await prisma.message.updateMany({
    where: { matchId, toUserId: userId, isRead: false },
    data: { isRead: true, readAt: now },
  });

  return NextResponse.json({ ok: true, updated: result.count, readAt: now.toISOString() });
}