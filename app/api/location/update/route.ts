// app/api/location/update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toFloatOrNull(v: any): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: any) {
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 25_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "loc_update", limit: 30, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "BAD_BODY" }, { status: 400 });
  }

  const lat = toFloatOrNull((body as any).lat);
  const lng = toFloatOrNull((body as any).lng);
  const city = toStr((body as any).city).trim(); // optioneel label

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