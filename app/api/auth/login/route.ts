import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken, setSession } from "@/lib/auth";

export const runtime = "nodejs";

async function readBody(req: Request): Promise<{ email?: string; password?: string }> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await req.json().catch(() => ({}))) as any;

  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    return {
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
    };
  }
  return {};
}

export async function POST(req: Request) {
  const { email = "", password = "" } = await readBody(req);

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return NextResponse.json({ error: "Email en wachtwoord zijn verplicht" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) return NextResponse.json({ error: "Ongeldige login" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Ongeldige login" }, { status: 401 });

  const token = await signToken(user.id);

  const res = NextResponse.redirect(new URL("/discover", req.url), 303);
  setSession(res, token, req.url);
  return res;
}

