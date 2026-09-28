import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = await rateLimitOrNull({ key: "profile_pause", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.paused !== "boolean") return NextResponse.json({ ok: false, error: "BAD_BODY" }, { status: 400 });

  await prisma.user.update({ where: { id: session.user.id }, data: { isPaused: body.paused } });
  return NextResponse.json({ ok: true, paused: body.paused });
}
