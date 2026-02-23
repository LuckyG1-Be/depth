import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toStr(v: any) {
  return typeof v === "string" ? v : "";
}

function toFloatOrNull(v: any): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 40_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "profile_update_user", limit: 120, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const u = body?.user;
  if (!u || typeof u !== "object") return NextResponse.json({ ok: false, error: "BAD_BODY" }, { status: 400 });

  const name = toStr((u as any).name).trim();
  const gender = toStr((u as any).gender).trim();

  const city = toStr((u as any).city).trim();
  const placeId = toStr((u as any).placeId).trim();
  const lat = toFloatOrNull((u as any).lat);
  const lng = toFloatOrNull((u as any).lng);

  // ✅ Als city gezet wordt, moet het uit autocomplete komen
  if (city.length > 0) {
    if (!placeId || lat == null || lng == null) {
      return NextResponse.json(
        { ok: false, error: "Kies je stad uit de lijst (autocomplete) zodat afstand werkt." },
        { status: 400 }
      );
    }
  }

  const data: any = {};
  if (name) data.name = name;
  if (gender) data.gender = gender;

  if (city === "") {
    // clear locatie (city blijft string)
    data.city = "";
    data.placeId = null;
    data.lat = null;
    data.lng = null;
  } else if (city.length > 0) {
    data.city = city;
    data.placeId = placeId;
    data.lat = lat;
    data.lng = lng;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });

  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}