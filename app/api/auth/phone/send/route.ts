import { NextResponse } from "next/server";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pickPhone(obj: Record<string, unknown>): string {
  const candidates = [obj.phone, obj.phoneNumber, obj.to, obj.msisdn];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

export async function POST(req: Request): Promise<Response> {
  const tooBig = await enforceMaxBodyBytes(req, 40_000);
  if (tooBig) return tooBig;

  const rl = rateLimitOrNull({
    key: "phone_send",
    limit: 20,
    windowMs: 60_000,
  });
  if (rl) return rl;

  try {
    const ct = req.headers.get("content-type") || "";
    let phone = "";

    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      phone = pickPhone(body);
    } else if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      phone =
        String(fd.get("phone") || "").trim() ||
        String(fd.get("phoneNumber") || "").trim() ||
        String(fd.get("to") || "").trim() ||
        String(fd.get("msisdn") || "").trim();
    } else {
      // x-www-form-urlencoded of plain text
      const text = await req.text();
      const p = new URLSearchParams(text);
      phone =
        String(p.get("phone") || "").trim() ||
        String(p.get("phoneNumber") || "").trim() ||
        String(p.get("to") || "").trim() ||
        String(p.get("msisdn") || "").trim();
    }

    if (!phone) {
      return NextResponse.json({ ok: false, error: "MISSING_PHONE" }, { status: 400 });
    }

    // ✅ DEV: simuleer “code verstuurd”
    // (je UI zegt al: code staat in terminal logs — als je dat echt wil,
    // kunnen we hier een console.log(code) doen)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    console.log("DEV_PHONE_CODE", { phone, code });

    return NextResponse.json({ ok: true, phone });
  } catch (e) {
    console.error("PHONE_SEND_ERROR", e);
    return NextResponse.json({ ok: false, error: "SEND_FAILED" }, { status: 500 });
  }
}
