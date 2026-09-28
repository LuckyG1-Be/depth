import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { contentTypeFromFilename, readUploadFileWithLegacyFallback } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "SAME_ORIGIN" }, { status: 403 });

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTH" }, { status: 401 });

  const viewerId = session.user.id;
  const { id } = await params;

  const url = new URL(req.url);
  const wRaw = url.searchParams.get("w"); // optional resize width
  const wantThumb = url.searchParams.get("thumb") === "1";

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { id: true, userId: true, path: true, mime: true, slot: true, thumbPath: true },
  });
  if (!photo) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // owner always view
  if (photo.userId !== viewerId) {
    // ✅ check silent block either way
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: photo.userId },
          { blockerId: photo.userId, blockedId: viewerId },
        ],
      },
      select: { id: true },
    });
    if (blocked) return NextResponse.json({ error: "BLOCKED" }, { status: 403 });

    // 🔒 Photos only accessible to non-owner when match is unlocked.
    const a = viewerId < photo.userId ? viewerId : photo.userId;
    const b = viewerId < photo.userId ? photo.userId : viewerId;

    const match = await prisma.match.findFirst({
      where: { userAId: a, userBId: b },
      select: { isUnlocked: true },
    });

    if (!match?.isUnlocked) return NextResponse.json({ error: "LOCKED" }, { status: 403 });
  }

  // Prefer generated thumb when asked
  const basePath = wantThumb && photo.thumbPath ? photo.thumbPath : photo.path;
  const buf = readUploadFileWithLegacyFallback(basePath);
  if (!buf) return NextResponse.json({ error: "FILE_MISSING" }, { status: 404 });

  // Optional resize (performance). Only downscale, never upscale.
  if (wRaw) {
    const w = clampInt(Number(wRaw), 96, 1600);
    if (Number.isFinite(w)) {
      const sharp = (await import("sharp")).default;
      const out = await sharp(buf)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      return new NextResponse(new Uint8Array(out), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }

  return new NextResponse(buf, {
    headers: {
      "Content-Type": photo.mime || contentTypeFromFilename(photo.path),
      "Cache-Control": "private, max-age=120",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
