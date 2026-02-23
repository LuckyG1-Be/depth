import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      city: true,
      gender: true,
      lookingFor: true,
      birthdate: true,
      phone: true,
      phoneVerifiedAt: true,
      verified: true,
      role: true,
      profile: true,
      photos: {
        orderBy: { slot: "asc" },
        select: { id: true, slot: true, mime: true, width: true, height: true, sizeBytes: true, createdAt: true },
      },
    },
  });

  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photos = me.photos.map((p) => ({
    id: p.id,
    slot: p.slot,
    url: `/api/photo/${p.id}`,
    mime: p.mime,
    width: p.width,
    height: p.height,
    sizeBytes: p.sizeBytes,
    createdAt: p.createdAt,
  }));

  // ✅ Belangrijk: zorg dat values/passions altijd JSON-strings zijn (compat met je UI)
  const profile = me.profile
    ? {
        ...me.profile,
        values: me.profile.values && me.profile.values.trim() ? me.profile.values : "[]",
        passions: me.profile.passions && me.profile.passions.trim() ? me.profile.passions : "[]",
      }
    : null;

  return NextResponse.json({ ...me, profile, photos });
}


