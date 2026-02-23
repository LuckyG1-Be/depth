import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import AdminVerificationsClient, { type AdminVerificationRow } from "./ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!me || (me.role || "USER").toUpperCase() !== "ADMIN") redirect("/");
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

export default async function AdminVerificationsPage() {
  await requireAdmin();

  const pending = await prisma.verificationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 80,
    select: {
      id: true,
      createdAt: true,
      selfiePath: true,
      selfiePaths: true,
      poseLabels: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          verified: true,
          photos: { orderBy: { slot: "asc" }, select: { id: true, slot: true } },
        },
      },
    },
  });

  const rows: AdminVerificationRow[] = pending.map((r) => {
    const selfiePaths = parseJsonArray(r.selfiePaths);
    const poses = parseJsonArray(r.poseLabels);
    const legacy = r.selfiePath ? [r.selfiePath] : [];
    const paths = selfiePaths.length ? selfiePaths : legacy;
    const labels = poses.length ? poses : paths.map((_, i) => `Selfie ${i + 1}`);

    return {
      id: r.id,
      createdAtISO: r.createdAt.toISOString(),
      user: {
        id: r.user.id,
        name: r.user.name || "(geen naam)",
        email: r.user.email || "",
        verified: !!r.user.verified,
        photos: r.user.photos.map((p) => ({ id: p.id, slot: p.slot })),
      },
      selfies: paths.map((_, i) => ({ index: i, label: labels[i] ?? `Selfie ${i + 1}` })),
      selfieCount: paths.length,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Admin · Verificaties</h1>
          <p className="mt-2 text-sm text-white/70">Pending: {rows.length}</p>
        </div>
        <Link
          href="/admin"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
        >
          Terug
        </Link>
      </div>

      <div className="mt-8">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            Geen pending verificaties.
          </div>
        ) : (
          <AdminVerificationsClient rows={rows} />
        )}
      </div>
    </main>
  );
}
