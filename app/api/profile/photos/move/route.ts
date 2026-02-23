import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLOTS = 6; // 0..5

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 8_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const ip = getClientIp(req);
  const rl = await rateLimitOrNull({ key: `photo_move:${userId}:${ip}`, limit: 120, windowMs: 60_000 });
  if (rl) return rl;

  const body = (await req.json().catch(() => null)) as null | { from?: number; to?: number };
  const from = body?.from;
  const to = body?.to;

  if (typeof from !== "number" || typeof to !== "number") {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  if (from < 0 || from >= MAX_SLOTS || to < 0 || to >= MAX_SLOTS) {
    return NextResponse.json({ error: "INVALID_SLOT" }, { status: 400 });
  }
  if (from === to) return NextResponse.json({ ok: true });

  // Ordered list (may contain gaps)
  const photos = await prisma.photo.findMany({
    where: { userId },
    orderBy: { slot: "asc" },
    select: { id: true, slot: true },
  });

  // If nothing at `from`, do nothing
  const hasFrom = photos.some((p) => p.slot === from);
  if (!hasFrom) return NextResponse.json({ ok: true });

  // Compact list to 0..n-1 (stable order by slot)
  const compact = [...photos].sort((a, b) => a.slot - b.slot);

  const fromIndex = compact.findIndex((p) => p.slot === from);
  if (fromIndex === -1) return NextResponse.json({ ok: true });

  // Target index within compact list
  const targetIndex = Math.max(0, Math.min(to, compact.length - 1));

  const [moved] = compact.splice(fromIndex, 1);
  compact.splice(targetIndex, 0, moved);

  // Limit to MAX_SLOTS
  const finalList = compact.slice(0, MAX_SLOTS);

  // 2-phase update to avoid unique (userId, slot) collisions
  await prisma.$transaction(async (tx) => {
    // Phase 1: temp slots
    for (let i = 0; i < finalList.length; i++) {
      await tx.photo.update({ where: { id: finalList[i].id }, data: { slot: 100 + i } });
    }
    // Phase 2: final slots 0..n-1
    for (let i = 0; i < finalList.length; i++) {
      await tx.photo.update({ where: { id: finalList[i].id }, data: { slot: i } });
    }
  });

  return NextResponse.json({ ok: true });
}
