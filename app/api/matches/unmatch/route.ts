import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 10_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "unmatch", limit: 30, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { matchId?: string };
  const matchId = String(body?.matchId || "").trim();
  if (!matchId) return NextResponse.json({ ok: false, error: "MISSING_MATCH" }, { status: 400 });

  const userId = session.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, userAId: true, userBId: true },
  });

  if (!match) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (match.userAId !== userId && match.userBId !== userId) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({ where: { matchId } });
    await tx.match.delete({ where: { id: matchId } });
  });

  return NextResponse.json({ ok: true });
}

