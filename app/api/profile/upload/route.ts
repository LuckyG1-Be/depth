import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLOTS = 6; // 0..5

/**
 * Expected JSON:
 * { slot: number, path: string, mime: string, width?: number, height?: number, sizeBytes?: number }
 */
export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 200_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "profile_upload_meta", limit: 40, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | {
    slot?: number;
    order?: number;
    path?: string;
    mime?: string;
    width?: number | null;
    height?: number | null;
    sizeBytes?: number | null;
  };

  const slot = typeof body?.slot === "number" ? body.slot : typeof body?.order === "number" ? body.order : null;
  if (slot === null || slot < 0 || slot >= MAX_SLOTS) return NextResponse.json({ error: "Invalid slot" }, { status: 400 });

  const filePath = (body?.path || "").trim();
  const mime = (body?.mime || "").trim();
  if (!filePath || !mime) return NextResponse.json({ error: "Missing path or mime" }, { status: 400 });

  const photo = await prisma.photo.upsert({
    where: { userId_slot: { userId: session.user.id, slot } },
    create: {
      userId: session.user.id,
      slot,
      path: filePath,
      mime,
      width: body?.width ?? null,
      height: body?.height ?? null,
      sizeBytes: body?.sizeBytes ?? null,
    },
    update: {
      path: filePath,
      mime,
      width: body?.width ?? null,
      height: body?.height ?? null,
      sizeBytes: body?.sizeBytes ?? null,
    },
    select: { id: true, slot: true, mime: true },
  });

  return NextResponse.json({
    ok: true,
    photo: { ...photo, url: `/api/photo/${photo.id}`, order: photo.slot },
  });
}
