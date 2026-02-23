import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 12_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "match_report", limit: 20, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | {
    otherUserId?: string;
    reason?: string;
  };

  const otherUserId = (body?.otherUserId || "").trim();
  const reason = (body?.reason || "").trim();

  if (!otherUserId) return NextResponse.json({ ok: false, error: "MISSING_OTHER" }, { status: 400 });
  if (otherUserId === session.user.id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  await prisma.accountFlag.create({
    data: {
      userId: session.user.id,
      code: "REPORT", // ✅ was type
      reason: `reported:${otherUserId}${reason ? `:${reason}` : ""}`,
    },
  });

  return NextResponse.json({ ok: true });
}
