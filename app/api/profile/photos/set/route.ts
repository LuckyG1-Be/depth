import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes, rateLimitOrNull, getClientIp } from "@/lib/security";
import { deleteUploadIfExists, saveUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLOTS = 6; // 0..5

async function normalizeSlots(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { userId },
    orderBy: { slot: "asc" },
    select: { id: true, slot: true },
  });

  const compact = [...photos].sort((a, b) => a.slot - b.slot).slice(0, MAX_SLOTS);

  await prisma.$transaction(async (tx) => {
    // Phase 1: temp slots
    for (let i = 0; i < compact.length; i++) {
      await tx.photo.update({
        where: { id: compact[i].id },
        data: { slot: 100 + i },
      });
    }
    // Phase 2: final slots
    for (let i = 0; i < compact.length; i++) {
      await tx.photo.update({
        where: { id: compact[i].id },
        data: { slot: i },
      });
    }
  });
}

function uploadErrorToHttp(e: any) {
  const msg = String(e?.message || "");

  if (msg === "UNSUPPORTED_FILETYPE") {
    return {
      status: 400,
      body: { error: "Unsupported filetype. Upload JPG/PNG/WebP (geen HEIC/SVG)." },
    };
  }
  if (msg === "FILE_TOO_LARGE") {
    return { status: 413, body: { error: "Bestand te groot (max 8MB) of te hoge resolutie." } };
  }
  if (msg === "IMAGE_TOO_SMALL") {
    return { status: 400, body: { error: "Afbeelding is te klein. Upload minimum 320×320." } };
  }
  if (msg === "DUPLICATE_PHOTO") {
    return { status: 400, body: { error: "Deze foto heb je al toegevoegd (duplicaat gedetecteerd)." } };
  }

  return { status: 500, body: { error: "Upload mislukt. Probeer opnieuw." } };
}

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 9_000_000);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const ip = getClientIp(req);
  const rl = await rateLimitOrNull({ key: `photo_set:${userId}:${ip}`, limit: 25, windowMs: 60_000 });
  if (rl) return rl;

  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const slotRaw = String(fd.get("slot") ?? "").trim();
  const slot = Number(slotRaw);
  if (!Number.isFinite(slot) || slot < 0 || slot >= MAX_SLOTS) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  const file = fd.get("photo");
  if (!file || typeof file !== "object" || !("arrayBuffer" in (file as any))) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const f = file as any;

  try {
    const saved = await saveUpload({
      name: f.name || "upload",
      type: typeof f.type === "string" ? f.type : undefined,
      size: typeof f.size === "number" ? f.size : undefined,
      arrayBuffer: () => f.arrayBuffer(),
    });

    // Upsert photo in slot
    const existing = await prisma.photo.findFirst({
      where: { userId, slot },
      select: { id: true, path: true, thumbPath: true },
    });

    // ✅ Duplicate detection (very basic): same contentHash already used in another slot
    const dup = await prisma.photo.findFirst({
      where: {
        userId,
        contentHash: saved.contentHash,
        ...(existing ? { NOT: { id: existing.id } } : {}),
      },
      select: { id: true, slot: true },
    });

    if (dup) {
      await deleteUploadIfExists(saved.uploadPath);
      throw new Error("DUPLICATE_PHOTO");
    }

    const patch = {
      path: saved.uploadPath,
      mime: saved.mime,
      width: saved.width ?? undefined,
      height: saved.height ?? undefined,
      sizeBytes: saved.sizeBytes ?? undefined,
      contentHash: saved.contentHash,
      aHash: saved.aHash,
      thumbPath: saved.thumbPath,
    };

    try {
      if (existing) {
        await prisma.photo.update({ where: { id: existing.id }, data: patch });
        await deleteUploadIfExists(existing.path);
      } else {
        await prisma.photo.create({
          data: {
            userId,
            slot,
            ...patch,
          },
        });
      }
    } catch (dbError) {
      await deleteUploadIfExists(saved.uploadPath);
      throw dbError;
    }

    // Normalize to 0..MAX_SLOTS-1 without gaps
    await normalizeSlots(userId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const mapped = uploadErrorToHttp(e);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
