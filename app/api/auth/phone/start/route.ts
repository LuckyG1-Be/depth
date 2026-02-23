import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";
import { normalizePhone } from "@/lib/phone";
import { createHash } from "crypto";
import twilio from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function canSendSms() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM
  );
}

async function sendSmsTwilio(to: string, body: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  return client.messages.create({
    to,
    from: process.env.TWILIO_FROM!,
    body,
  });
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 20_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({
    key: "phone_start",
    limit: 10,
    windowMs: 60_000,
    message: "Te veel aanvragen. Probeer straks opnieuw.",
  });
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const phone = normalizePhone(String(phoneRaw || "").trim());

  if (!phone || phone.length < 8) {
    return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
  }

  // cleanup expired
  await prisma.phoneOtp.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  const code = generateCode();
  const codeHash = sha256(code);
  const ip = getClientIp(req) || null;

  await prisma.phoneOtp.upsert({
    where: { phone }, // phone is @unique
    create: {
      phone,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      ip,
    },
    update: {
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      ip,
    },
  });

  const isDev = process.env.NODE_ENV !== "production";

  // ✅ DEV: altijd code teruggeven
  if (isDev) {
    console.log("DEV_PHONE_CODE", { phone, code });
    return NextResponse.json({ ok: true, devCode: code });
  }

  // ✅ PROD: SMS sturen via Twilio als geconfigureerd
  if (canSendSms()) {
    try {
      const appName = process.env.APP_NAME || "Depth";
      const msg = `${appName} code: ${code}\nGeldig: 10 min.`;

      await sendSmsTwilio(phone, msg);
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("TWILIO_SEND_FAILED", e);

      // 🔧 Optionele fallback: laat je in productie toch testen als je dat expliciet aanzet
      // Zet in Vercel: OTP_DEBUG=1 om tijdelijk devCode te krijgen wanneer SMS faalt
      if (process.env.OTP_DEBUG === "1") {
        return NextResponse.json({ ok: true, devCode: code, warn: "SMS_FAILED_DEBUG_MODE" });
      }

      return NextResponse.json({ ok: false, error: "SMS_SEND_FAILED" }, { status: 500 });
    }
  }

  // ❗ Geen SMS-config → je zou anders nooit een code krijgen
  console.warn("SMS_NOT_CONFIGURED: Missing TWILIO_* env vars.");

  // 🔧 Optionele fallback: voor snelle live tests, zet OTP_DEBUG=1 in je env
  if (process.env.OTP_DEBUG === "1") {
    return NextResponse.json({ ok: true, devCode: code, warn: "SMS_NOT_CONFIGURED_DEBUG_MODE" });
  }

  return NextResponse.json({ ok: false, error: "SMS_NOT_CONFIGURED" }, { status: 500 });
}