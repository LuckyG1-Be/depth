import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
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
    await prisma.emailOtp.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 400 });
  }

  await prisma.emailOtp.delete({ where: { email } });

  return NextResponse.json({ ok: true });
}