import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 8_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as null | { matchId?: string };
  const matchId = (body?.matchId || "").trim();
  if (!matchId) {
    return NextResponse.json({ ok: false, error: "MISSING_MATCH" }, { status: 400 });
  }

  const meId = session.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, userAId: true, userBId: true },
  });

  if (!match) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  if (match.userAId !== meId && match.userBId !== meId) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const now = new Date();

  const updated = await prisma.message.updateMany({
    where: { matchId, toUserId: meId, isRead: false },
    data: { isRead: true, readAt: now },
  });

  return NextResponse.json({ ok: true, updated: updated.count });
}