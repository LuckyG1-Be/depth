import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { enforceMaxBodyBytes, getClientIp, rateLimitOrNull } from "@/lib/security";
import { saveUpload, type UploadableFile } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 7_500_000;

function stripDataUrl(dataUrl: string): string {
  const i = dataUrl.indexOf(",");
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

function toPlainArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.length);
  new Uint8Array(ab).set(buf);
  return ab;
}

type Incoming = {
  selfies?: Array<{ dataUrl?: string; pose?: string }>;
};

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, MAX_BODY_BYTES);
  if (tooBig) return tooBig;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const userId = session.user.id;
  const ip = getClientIp(req);

  const rl = rateLimitOrNull({
    key: `verify:selfie:submit:${userId}:${ip}`,
    limit: 6,
    windowMs: 10 * 60 * 1000,
    message: "TRY_LATER",
  });
  if (rl) return rl;

  const body = (await req.json().catch(() => null)) as Incoming | null;
  const selfiesRaw = Array.isArray(body?.selfies) ? body!.selfies! : [];

  if (selfiesRaw.length < 3) {
    return NextResponse.json({ ok: false, error: "NEED_MORE_SELFIES" }, { status: 400 });
  }

  const selfies = selfiesRaw
    .map((s) => ({
      dataUrl: s?.dataUrl ? String(s.dataUrl) : "",
      pose: s?.pose ? String(s.pose) : "",
    }))
    .filter((s) => s.dataUrl && s.pose);

  if (selfies.length < 3) {
    return NextResponse.json({ ok: false, error: "BAD_SELFIES" }, { status: 400 });
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true, photos: { take: 1, select: { id: true } } },
  });

  if (!me) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (me.verified) return NextResponse.json({ ok: true, alreadyVerified: true });

  if (!me.photos?.length) {
    return NextResponse.json({ ok: false, error: "NO_PROFILE_PHOTO" }, { status: 400 });
  }

  const existing = await prisma.verificationRequest.findFirst({
    where: { userId, status: "PENDING" },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ ok: true, pending: true, id: existing.id });

  const savedPaths: string[] = [];
  const poseLabels: string[] = [];

  for (let idx = 0; idx < selfies.length; idx++) {
    const s = selfies[idx];

    let buf: Buffer;
    try {
      buf = Buffer.from(stripDataUrl(s.dataUrl), "base64");
    } catch {
      return NextResponse.json({ ok: false, error: "BAD_SELFIE_DATA" }, { status: 400 });
    }

    const uploadFile: UploadableFile = {
      name: `selfie-${userId}-${idx + 1}.jpg`,
      type: "image/jpeg",
      size: buf.length,
      arrayBuffer: async () => toPlainArrayBuffer(buf),
    };

    const saved = await saveUpload(uploadFile);
    savedPaths.push(saved.uploadPath);
    poseLabels.push(s.pose);
  }

  const created = await prisma.verificationRequest.create({
    data: {
      userId,
      status: "PENDING",
      selfiePaths: JSON.stringify(savedPaths),
      poseLabels: JSON.stringify(poseLabels),
    },
    select: { id: true, status: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, request: created });
}