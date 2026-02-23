import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLOTS = 6; // 0..5

async function readParams(req: Request) {
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    return {
      photoId: String((j as any)?.photoId || "").trim(),
      direction: String((j as any)?.direction || "").trim(),
    };
  }

  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const p = new URLSearchParams(text);
    return {
      photoId: String(p.get("photoId") || "").trim(),
      direction: String(p.get("direction") || "").trim(),
    };
  }

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    return {
      photoId: String(fd.get("photoId") || "").trim(),
      direction: String(fd.get("direction") || "").trim(),
    };
  }

  return { photoId: "", direction: "" };
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 20_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const ip = getClientIp(req);
  const rl = await rateLimitOrNull({ key: `photo_swap:${userId}:${ip}`, limit: 180, windowMs: 60_000 });
  if (rl) return rl;

  const { photoId, direction } = await readParams(req);
  if (!photoId) return NextResponse.json({ ok: false, error: "MISSING_PHOTO_ID" }, { status: 400 });
  if (direction !== "left" && direction !== "right") {
    return NextResponse.json({ ok: false, error: "INVALID_DIRECTION" }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({ where: { id: photoId }, select: { id: true, userId: true, slot: true } });
  if (!photo) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (photo.userId !== userId) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const from = photo.slot;
  const to = direction === "left" ? from - 1 : from + 1;

  if (to < 0 || to >= MAX_SLOTS) return NextResponse.json({ ok: true }); // nothing to do

  const other = await prisma.photo.findUnique({
    where: { userId_slot: { userId, slot: to } },
    select: { id: true, slot: true },
  });

  await prisma.$transaction(async (tx) => {
    if (other) {
      // swap slots safely
      await tx.photo.update({ where: { id: photo.id }, data: { slot: 999 } });
      await tx.photo.update({ where: { id: other.id }, data: { slot: from } });
      await tx.photo.update({ where: { id: photo.id }, data: { slot: to } });
    } else {
      await tx.photo.update({ where: { id: photo.id }, data: { slot: to } });
    }
  });

  return NextResponse.json({ ok: true });
}


