import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!me || (me.role || "USER").toUpperCase() !== "ADMIN") return null;
  return me;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const id = params.id;

  const form = await req.formData().catch(() => null);
  const action = String(form?.get("action") || "");

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ ok: false, error: "BAD_ACTION" }, { status: 400 });
  }

  const row = await prisma.verificationRequest.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true },
  });

  if (!row) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (row.status !== "PENDING") return NextResponse.redirect(new URL("/admin/verifications", req.url));

  if (action === "APPROVE") {
    await prisma.$transaction([
      prisma.verificationRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewerId: admin.id,
          reviewedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: row.userId },
        data: { verified: true },
      }),
      prisma.verificationRequest.updateMany({
        where: { userId: row.userId, status: "PENDING", NOT: { id } },
        data: {
          status: "REJECTED",
          reviewerId: admin.id,
          reviewedAt: new Date(),
        },
      }),
    ]);
  } else {
    await prisma.verificationRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewerId: admin.id,
        reviewedAt: new Date(),
      },
    });
  }

  return NextResponse.redirect(new URL("/admin/verifications", req.url));
}