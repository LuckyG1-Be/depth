import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { contentTypeFromFilename, readUploadFileWithLegacyFallback } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return false;

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return !!me && (me.role || "USER").toUpperCase() === "ADMIN";
}

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "SAME_ORIGIN" }, { status: 403 });

  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(req.url);
  const idx = Math.max(0, parseInt(url.searchParams.get("i") || "0", 10) || 0);

  const { id } = await params;
  const row = await prisma.verificationRequest.findUnique({
    where: { id },
    select: { selfiePath: true, selfiePaths: true },
  });
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const paths = parseJsonArray(row.selfiePaths);
  const chosen = paths.length ? paths[Math.min(idx, paths.length - 1)] : row.selfiePath;

  if (!chosen) return NextResponse.json({ error: "MISSING" }, { status: 404 });

  const buf = readUploadFileWithLegacyFallback(chosen);
  if (!buf) return NextResponse.json({ error: "FILE_MISSING" }, { status: 404 });

  const ct = contentTypeFromFilename(chosen) || "image/webp";
  return new NextResponse(buf, {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "no-store",
    },
  });
}
