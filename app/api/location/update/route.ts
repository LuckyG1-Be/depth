// app/api/location/update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes, getClientIp, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toFloatOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 25_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const rl = await rateLimitOrNull({
    key: `loc_update:${userId}:${getClientIp(req)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "BAD_BODY" }, { status: 400 });
  }

  const input = body as { lat?: unknown; lng?: unknown; city?: unknown };
  const lat = toFloatOrNull(input.lat);
  const lng = toFloatOrNull(input.lng);
  const city = toStr(input.city).trim(); // optioneel label

  if (lat == null || lng == null) {
    return NextResponse.json({ ok: false, error: "MISSING_COORDS" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ ok: false, error: "BAD_COORDS" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      lat,
      lng,
      ...(city ? { city } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
