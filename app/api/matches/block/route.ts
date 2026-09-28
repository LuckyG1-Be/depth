import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withTx } from "@/lib/dbTx";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 10_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "matches_block", limit: 30, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { otherUserId?: string; otherId?: string; reason?: string };
  const otherId = (body?.otherUserId || body?.otherId || "").trim();
  const reason = (body?.reason || "").trim() || null;

  if (!otherId) return NextResponse.json({ ok: false, error: "MISSING_OTHER" }, { status: 400 });
  if (otherId === session.user.id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true } });
  if (!target) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const me = session.user.id;

  await withTx(async (tx) => {
    await tx.block.upsert({
      where: { blockerId_blockedId: { blockerId: me, blockedId: otherId } },
      update: { reason: reason ?? undefined },
      create: { blockerId: me, blockedId: otherId, reason: reason ?? undefined },
    });

    await tx.accountFlag.create({
      data: { userId: me, code: "USER_BLOCK", reason: `blocked:${otherId}${reason ? `:${reason}` : ""}` },
    });

    await tx.like.deleteMany({
      where: {
        OR: [
          { fromUserId: me, toUserId: otherId },
          { fromUserId: otherId, toUserId: me },
        ],
      },
    });

    const a = me < otherId ? me : otherId;
    const b = me < otherId ? otherId : me;

    const match = await tx.match.findFirst({ where: { userAId: a, userBId: b }, select: { id: true } });
    if (match) {
      await tx.match.update({ where: { id: match.id }, data: { isArchived: true, archivedAt: new Date() } });
    }
  });

  return NextResponse.json({ ok: true });
}
