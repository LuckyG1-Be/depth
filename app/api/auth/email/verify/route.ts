import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { EMAIL_VERIFY_COOKIE, makeEmailToken } from "@/lib/email";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 8_000);
  if (tooBig) return tooBig;
  const rl = await rateLimitOrNull({
    key: "email_verify",
    limit: 20,
    windowMs: 60_000,
    message: "Te veel pogingen. Probeer straks opnieuw.",
  });
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const code = (body?.code || "").trim();

  if (!email || !code) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const otp = await prisma.emailOtp.findUnique({ where: { email } });

  if (!otp || otp.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "EXPIRED" }, { status: 400 });
  }

  if (otp.codeHash !== sha256(code)) {
    if (otp.attempts >= 10) {
      await prisma.emailOtp.delete({ where: { email } }).catch(() => {});
      return NextResponse.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
    }
    await prisma.emailOtp.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 400 });
  }

  await prisma.emailOtp.delete({ where: { email } });

  const response = NextResponse.json({ ok: true });
  const token = await makeEmailToken(email, "REGISTER", 30 * 60 * 1000);
  response.cookies.set(EMAIL_VERIFY_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  });
  return response;
}
