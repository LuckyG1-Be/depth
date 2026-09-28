import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  // The global header also renders on public pages, so an anonymous visitor
  // should receive an empty counter rather than a noisy authentication error.
  if (!session?.user?.id) return NextResponse.json({ ok: true, count: 0 }, { status: 200 });

  const userId = session.user.id;

  // ✅ Count only unread messages in ACTIVE matches
  const count = await prisma.message.count({
    where: {
      toUserId: userId,
      isRead: false,
      match: { isArchived: false },
    },
  });

  return NextResponse.json({ ok: true, count });
}
