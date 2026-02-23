import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 5_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "profile_city", limit: 60, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { city?: string };
  const city = String(body?.city || "").trim();

  if (!city) return NextResponse.json({ ok: false, error: "MISSING_CITY" }, { status: 400 });
  if (city.length > 80) return NextResponse.json({ ok: false, error: "CITY_TOO_LONG" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { city },
  });

  return NextResponse.json({ ok: true });
}

