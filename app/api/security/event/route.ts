import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/security/risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getSession();

    const body = (await req.json().catch(() => null)) as null | {
      type?: string;
      severity?: number;
      meta?: Record<string, any>;
    };

    if (!body?.type) {
      return NextResponse.json(
        { ok: false, error: "MISSING_TYPE" },
        { status: 400 }
      );
    }

    const severity =
      typeof body.severity === "number"
        ? Math.max(1, Math.min(5, body.severity))
        : 1;

    await logSecurityEvent({
      // ✅ FIX: nooit null, alleen undefined of string
      userId: session?.user?.id ?? undefined,
      req,
      type: body.type,
      severity,
      scoreDelta: 0,
      meta: body.meta ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /api/security/event failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "EVENT_FAILED" },
      { status: 500 }
    );
  }
}
