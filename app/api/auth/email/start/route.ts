import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();

  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
  }

  const code = generateCode();
  const codeHash = sha256(code);

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

  await resend.emails.send({
    from: process.env.APP_EMAIL_FROM!,
    to: email,
    subject: `${process.env.APP_NAME || "Depth"} verification code`,
    html: `
      <div style="font-family:sans-serif">
        <h2>Your verification code</h2>
        <p style="font-size:24px;font-weight:bold">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}