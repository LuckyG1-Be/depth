import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { dayKeyBrussels } from "@/lib/dayKey";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isP2002(e: unknown) {
  return typeof e === "object" && e !== null && (e as any).code === "P2002";
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 8_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const ip = getClientIp(req);
  const rl = await rateLimitOrNull({ key: `discover_pass:${userId}:${ip}`, limit: 160, windowMs: 60_000, message: "Te snel." });
  if (rl) return rl;

  const body = (await req.json().catch(() => null)) as null | { otherUserId?: string };
  const otherUserId = String(body?.otherUserId || "").trim();
  if (!otherUserId) return NextResponse.json({ ok: false, error: "MISSING" }, { status: 400 });
  if (otherUserId === userId) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  // ✅ pass is idempotent; seenUsed wordt al op /discover afgerekend
  // we markeren wel "seen" voor zekerheid (skip duplicate)
  const dk = dayKeyBrussels();
  try {
    await prisma.seenProfile.create({ data: { userId, seenUserId: otherUserId, dayKey: dk } });
  } catch (e) {
    if (!isP2002(e)) throw e;
  }

  return NextResponse.json({ ok: true });
}