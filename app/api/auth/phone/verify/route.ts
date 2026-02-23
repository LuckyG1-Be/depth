import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";
import { PHONE_PENDING_COOKIE, PHONE_VERIFY_COOKIE, readPhoneToken, makePhoneToken, normalizePhone } from "@/lib/phone";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function getCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie") || "";
  const found = raw
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.split("=").slice(1).join("="));
}

async function readBody(req: Request): Promise<{ code?: string; phone?: string }> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as any;
  }
  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    return {
      code: String(fd.get("code") || ""),
      phone: String(fd.get("phone") || ""),
    };
  }
  return {};
}

export async function POST(req: Request): Promise<Response> {
  const tooBig = await enforceMaxBodyBytes(req, 8_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({
    key: "phone_verify",
    limit: 20,
    windowMs: 60_000,
    message: "Te veel pogingen. Probeer straks opnieuw.",
  });
  if (rl) return rl;

  const pendingRaw = getCookie(req, PHONE_PENDING_COOKIE);
  const pending = await readPhoneToken(pendingRaw);

  const body = await readBody(req);
  const code = String(body.code || "").trim();
  if (!code) return NextResponse.json({ ok: false, error: "MISSING_INPUT" }, { status: 400 });

  // ✅ phone uit pending OF fallback uit body
  const phone = pending?.phone || normalizePhone(String(body.phone || "").trim());
  const purpose = pending?.purpose || "REGISTER";

  if (!phone) {
    return NextResponse.json({ ok: false, error: "NO_ACTIVE_VERIFICATION" }, { status: 400 });
  }

  const row = await prisma.phoneOtp.findUnique({ where: { phone } });
  if (!row) return NextResponse.json({ ok: false, error: "NO_OTP" }, { status: 400 });

  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.phoneOtp.delete({ where: { phone } }).catch(() => {});
    return NextResponse.json({ ok: false, error: "CODE_EXPIRED" }, { status: 400 });
  }

  if (row.attempts >= 10) {
    return NextResponse.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
  }

  const ip = getClientIp(req) || null;

  const ok = sha256(code) === row.codeHash;
  if (!ok) {
    await prisma.phoneOtp.update({
      where: { phone },
      data: { attempts: row.attempts + 1, ip: ip ?? row.ip ?? null },
    });
    return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });

  const verifiedToken = await makePhoneToken(phone, purpose, 30 * 60 * 1000);

  res.cookies.set(PHONE_VERIFY_COOKIE, verifiedToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  });

  // clear pending
  res.cookies.set(PHONE_PENDING_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  await prisma.phoneOtp.delete({ where: { phone } }).catch(() => {});
  return res;
}
