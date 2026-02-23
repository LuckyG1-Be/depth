import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInt(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toStr(v: any) {
  return typeof v === "string" ? v : "";
}

function toFloatOrNull(v: any): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeJsonArray(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  try {
    const v = JSON.parse(String(raw));
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 50_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "profile_update", limit: 120, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "BAD_BODY" }, { status: 400 });
  }

  // USER fields
  const name = toStr((body as any).name).trim();
  const city = toStr((body as any).city).trim();
  const gender = toStr((body as any).gender).trim();
  const lookingFor = toStr((body as any).lookingFor).trim();

  // 👇 locatie (moet komen uit autocomplete)
  const lat = toFloatOrNull((body as any).lat);
  const lng = toFloatOrNull((body as any).lng);
  const placeId = toStr((body as any).placeId).trim();

  // PROFILE fields
  const intent = toStr((body as any).intent).trim();
  const religion = toStr((body as any).religion).trim();
  const valuesArr = safeJsonArray((body as any).values);
  const passionsArr = safeJsonArray((body as any).passions);

  const q1 = toStr((body as any).q1);
  const q2 = toStr((body as any).q2);
  const q3 = toStr((body as any).q3);
  const q4 = toStr((body as any).q4);
  const q5 = toStr((body as any).q5);

  // PREFERENCES fields
  const minAge = toInt((body as any).minAge, 18);
  const maxAge = toInt((body as any).maxAge, 99);
  const maxDistanceKm = toInt((body as any).maxDistanceKm, 50);
  const genders = safeJsonArray((body as any).genders);

  const intentFilter = toStr((body as any).intentFilter).trim();
  const religionFilter = toStr((body as any).religionFilter).trim();
  const valuesFilter = safeJsonArray((body as any).valuesFilter);

  // ✅ VALIDATIE: als city ingevuld is, MOET het uit de lijst gekozen zijn (lat/lng + placeId)
  if (city.length > 0) {
    if (lat == null || lng == null || !placeId) {
      return NextResponse.json(
        { ok: false, error: "Kies je locatie uit de lijst (autocomplete) zodat afstand werkt." },
        { status: 400 }
      );
    }
  }

  // leeftijdsrange sanity (niet verplicht, maar houdt data proper)
  if (minAge < 18 || maxAge > 99 || minAge > maxAge) {
    return NextResponse.json({ ok: false, error: "AGE_RANGE_INVALID" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const userUpdate: any = {};

    if (name) userUpdate.name = name;

    // city: als leeg → clear + coords clear
    if (city === "") {
      userUpdate.city = null;
      userUpdate.lat = null;
      userUpdate.lng = null;
      userUpdate.placeId = null;
    } else {
      // city gekozen uit autocomplete
      userUpdate.city = city;
      userUpdate.lat = lat;
      userUpdate.lng = lng;
      userUpdate.placeId = placeId;
    }

    if (gender) userUpdate.gender = gender;
    if (lookingFor) userUpdate.lookingFor = lookingFor;

    await tx.user.update({ where: { id: userId }, data: userUpdate });

    await tx.profile.upsert({
      where: { userId },
      create: {
        userId,
        intent: intent || "Serieuze relatie",
        religion: religion || null,
        values: JSON.stringify(valuesArr),
        passions: JSON.stringify(passionsArr),
        q1: q1 || null,
        q2: q2 || null,
        q3: q3 || null,
        q4: q4 || null,
        q5: q5 || null,
      },
      update: {
        ...(intent ? { intent } : {}),
        ...(religion ? { religion } : {}),
        values: JSON.stringify(valuesArr),
        passions: JSON.stringify(passionsArr),
        q1: q1 || null,
        q2: q2 || null,
        q3: q3 || null,
        q4: q4 || null,
        q5: q5 || null,
      },
    });

    await tx.preferences.upsert({
      where: { userId },
      create: {
        userId,
        minAge,
        maxAge,
        maxDistanceKm,
        genders: JSON.stringify(genders.length ? genders : ["Vrouw", "Man", "Non-binair"]),
        intentFilter: intentFilter || null,
        religionFilter: religionFilter || null,
        valuesFilter: valuesFilter.length ? JSON.stringify(valuesFilter) : null,
      },
      update: {
        minAge,
        maxAge,
        maxDistanceKm,
        genders: JSON.stringify(genders.length ? genders : ["Vrouw", "Man", "Non-binair"]),
        intentFilter: intentFilter || null,
        religionFilter: religionFilter || null,
        valuesFilter: valuesFilter.length ? JSON.stringify(valuesFilter) : null,
      },
    });
  });

  return NextResponse.json({ ok: true });
}