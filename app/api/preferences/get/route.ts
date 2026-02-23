import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map((x) => String(x || "").trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const userId = session.user.id;

  // ✅ Work around stale Prisma typings in TS server (verifiedOnly not in generated types yet)
  const pAny = (prisma as any).preferences;

  const prefs = await pAny.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      minAge: 20,
      maxAge: 35,
      maxDistanceKm: 50,
      genders: JSON.stringify(["Vrouw", "Man"]),
      verifiedOnly: false,
    },
    select: {
      minAge: true,
      maxAge: true,
      maxDistanceKm: true,
      genders: true,
      intentFilter: true,
      religionFilter: true,
      valuesFilter: true,
      verifiedOnly: true,
    },
  });

  return NextResponse.json({
    ok: true,
    preferences: {
      minAge: prefs.minAge,
      maxAge: prefs.maxAge,
      maxDistanceKm: prefs.maxDistanceKm,
      genders: safeJsonArray(prefs.genders),

      intentFilter: prefs.intentFilter,
      religionFilter: prefs.religionFilter,
      valuesFilter: safeJsonArray(prefs.valuesFilter),

      verifiedOnly: !!prefs.verifiedOnly,
    },
  });
}