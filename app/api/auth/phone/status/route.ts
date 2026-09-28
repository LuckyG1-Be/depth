import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PHONE_VERIFY_COOKIE, verifyPhoneVerifyToken } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const token = (await cookies()).get(PHONE_VERIFY_COOKIE)?.value;
  if (!token) return NextResponse.json({ ok: false });

  const phone = await verifyPhoneVerifyToken(token);
  if (!phone) return NextResponse.json({ ok: false });

  return NextResponse.json({ ok: true, phone });
}
