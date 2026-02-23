import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/security/risk";
import { touchDevice } from "@/lib/device";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Logs/updates a device fingerprint based on request headers.
 * This endpoint is safe to call even when logged out.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();

    // Optional JSON payload (e.g. client can send tz/platform/lang)
    const body = (await req.json().catch(() => null)) as null | {
      platform?: string | null;
      tz?: string | null;
      lang?: string | null;
      meta?: Record<string, any>;
    };

    const userId = session?.user?.id ?? undefined;

    // If logged in, persist fingerprint for that user (best signal)
    if (userId) {
      await touchDevice({
        req,
        userId,
        didLogin: false,
        meta: {
          platform: body?.platform ?? undefined,
          tz: body?.tz ?? undefined,
          lang: body?.lang ?? undefined,
        },
      }).catch(() => {});
    }

    await logSecurityEvent({
      // ✅ FIX: nooit null
      userId,
      req,
      type: userId ? "DEVICE_MISMATCH" : "DEVICE_NEW",
      severity: 2,
      scoreDelta: 0,
      meta: {
        ...(body?.meta ?? {}),
        platform: body?.platform ?? undefined,
        tz: body?.tz ?? undefined,
        lang: body?.lang ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /api/security/fingerprint failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "FINGERPRINT_FAILED" },
      { status: 500 }
    );
  }
}
