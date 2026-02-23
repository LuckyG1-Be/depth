import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonDownload(data: unknown, filename: string) {
  const body = JSON.stringify(data, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  }

  const userId = session.user.id;

  // Let op: GDPR export = “jouw data”. We laten passwordHash weg.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      city: true,
      lat: true,
      lng: true,
      placeId: true,
      gender: true,
      lookingFor: true,
      birthdate: true,
      phone: true,
      phoneVerifiedAt: true,
      verified: true,
      isBlocked: true,
      chatBannedUntil: true,
      riskScore: true,
      riskLevel: true,
      lastLoginAt: true,
      lastIp: true,
      lastUaHash: true,
      role: true,
      createdAt: true,
      updatedAt: true,

      profile: true,
      preferences: true,
      photos: {
        orderBy: { slot: "asc" },
        select: {
          id: true,
          slot: true,
          path: true,
          mime: true,
          width: true,
          height: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
      likesGiven: true,
      likesReceived: true,
      dailyQuota: true,
      seenProfiles: true,
      flags: true,
      devices: true,
      securityEvents: true,
      blocksGiven: true,
      blocksReceived: true,
      reportsGiven: true,
      reportsReceived: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    app: "Depth",
    user: {
      ...user,
      // expliciet: nooit exporteren
      passwordHash: undefined,
    },
    matches,
  };

  // filename met datum
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const filename = `depth-account-export-${yyyy}-${mm}-${dd}.json`;

  return jsonDownload(exportPayload, filename);
}