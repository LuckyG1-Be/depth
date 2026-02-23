import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function cleanStringArray(v: any) {
  const arr = Array.isArray(v) ? v : [];
  return arr.map((x) => String(x || "").trim()).filter(Boolean);
}

function cleanNullableString(v: any) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const p = body?.preferences;
  if (!p) return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });

  let minAge = clampInt(p.minAge, 18, 99, 20);
  let maxAge = clampInt(p.maxAge, 18, 99, 35);
  if (minAge > maxAge) [minAge, maxAge] = [maxAge, minAge];

  const maxDistanceKm = clampInt(p.maxDistanceKm, 1, 500, 50);

  const genders = cleanStringArray(p.genders);
  if (genders.length === 0) genders.push("Vrouw");

  const intentFilter = cleanNullableString(p.intentFilter);
  const religionFilter = cleanNullableString(p.religionFilter);
  const valuesFilterArr = cleanStringArray(p.valuesFilter);
  const valuesFilter = valuesFilterArr.length ? JSON.stringify(valuesFilterArr) : null;

  const verifiedOnly = !!p.verifiedOnly;

  // ✅ Work around stale Prisma typings in TS server
  const pAny = (prisma as any).preferences;

  await pAny.upsert({
    where: { userId },
    update: {
      minAge,
      maxAge,
      maxDistanceKm,
      genders: JSON.stringify(genders),

      intentFilter,
      religionFilter,
      valuesFilter,

      verifiedOnly,
    },
    create: {
      userId,
      minAge,
      maxAge,
      maxDistanceKm,
      genders: JSON.stringify(genders),

      intentFilter,
      religionFilter,
      valuesFilter,

      verifiedOnly,
    },
  });

  return NextResponse.json({ ok: true });
}