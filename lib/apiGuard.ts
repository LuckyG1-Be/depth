import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function apiGuard() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  return { userId: session.user.id };
}

