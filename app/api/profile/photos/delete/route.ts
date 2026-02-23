import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";
import { deleteUploadIfExists } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readParams(req: Request) {
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    return { photoId: String((j as any)?.photoId || "").trim() };
  }

  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const p = new URLSearchParams(text);
    return { photoId: String(p.get("photoId") || "").trim() };
  }

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    return { photoId: String(fd.get("photoId") || "").trim() };
  }

  return { photoId: "" };
}

async function normalizeSlots(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { userId },
    orderBy: { slot: "asc" },
    select: { id: true, slot: true },
  });

  let target = 0;
  const updates: Array<ReturnType<typeof prisma.photo.update>> = [];

  for (const p of photos) {
    if (p.slot !== target) {
      updates.push(prisma.photo.update({ where: { id: p.id }, data: { slot: target } }));
    }
    target++;
    if (target > 8) break;
  }

  if (updates.length) await prisma.$transaction(updates);
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 25_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "photo_delete", limit: 60, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  const userId = session.user.id;

  const { photoId } = await readParams(req);
  if (!photoId) return NextResponse.json({ ok: false, error: "MISSING_PHOTO_ID" }, { status: 400 });

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { id: true, userId: true, path: true },
  });

  if (!photo) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (photo.userId !== userId) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  await prisma.photo.delete({ where: { id: photoId } });
  await deleteUploadIfExists(photo.path);

  // ✅ schuif automatisch op
  await normalizeSlots(userId);

  return NextResponse.json({ ok: true });
}


