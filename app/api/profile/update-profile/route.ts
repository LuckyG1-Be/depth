import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampJsonArray(raw: any, exact: number) {
  const arr = Array.isArray(raw) ? raw : [];
  const cleaned = arr.map((x) => String(x || "").trim()).filter(Boolean);
  return cleaned.slice(0, exact);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const p = body?.profile;

  if (!p) return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });

  const intent = String(p.intent || "").trim();
  const religion = String(p.religion || "").trim() || null;

  const values = clampJsonArray(p.values, 3);
  const passions = clampJsonArray(p.passions, 4);

  const q1 = String(p.q1 || "");
  const q2 = String(p.q2 || "");
  const q3 = String(p.q3 || "");
  const q4 = String(p.q4 || "");
  const q5 = String(p.q5 || "");

  if (!intent) {
    return NextResponse.json({ ok: false, error: "Kies een intentie." }, { status: 400 });
  }

  // Ensure profile exists
  await prisma.profile.upsert({
    where: { userId },
    update: {
      intent,
      religion,
      values: JSON.stringify(values),
      passions: JSON.stringify(passions),
      q1,
      q2,
      q3,
      q4,
      q5,
    },
    create: {
      userId,
      intent,
      religion,
      values: JSON.stringify(values),
      passions: JSON.stringify(passions),
      q1,
      q2,
      q3,
      q4,
      q5,
    },
  });

  return NextResponse.json({ ok: true });
}