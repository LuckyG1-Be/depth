import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";
import { Resend } from "resend";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 8_000);
  if (tooBig) return tooBig;
  const rl = await rateLimitOrNull({
    key: "email_start",
    limit: 5,
    windowMs: 60_000,
    message: "Te veel aanvragen. Probeer straks opnieuw.",
  });
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();

  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
  }

  const code = generateCode();
  const codeHash = sha256(code);

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.APP_EMAIL_FROM;
  if (!resendApiKey || !from) {
    return NextResponse.json(
      { ok: false, error: "EMAIL_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  await prisma.emailOtp.upsert({
    where: { email },
    create: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    update: {
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    },
  });

  try {
    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from,
      to: email,
      subject: `${process.env.APP_NAME || "Depth"} verificatiecode`,
      html: `
      <div style="font-family:sans-serif">
        <h2>Je verificatiecode voor Depth</h2>
        <p style="font-size:24px;font-weight:bold">${code}</p>
        <p>Deze code vervalt binnen 10 minuten.</p>
      </div>
    `,
    });
    if (result.error) throw new Error(result.error.message);
  } catch (error) {
    await prisma.emailOtp.delete({ where: { email } }).catch(() => {});
    console.error("EMAIL_SEND_FAILED", error);
    return NextResponse.json({ ok: false, error: "EMAIL_SEND_FAILED" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
