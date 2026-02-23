import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearSession, getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  try {
    await prisma.user.delete({ where: { id: session.user.id } });

    const res = NextResponse.json({ ok: true });
    clearSession(res, req.url);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}