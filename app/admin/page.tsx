import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  });

  const role = (me?.role || "USER").toUpperCase();
  if (role !== "ADMIN") redirect("/");

  // Pending selfie verification requests
  const pendingCount = await prisma.verificationRequest.count({
    where: { status: "PENDING" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-white">Admin</h1>
      <p className="mt-2 text-sm text-white/70">Welcome, {me?.name ?? "Admin"}.</p>

      <div className="mt-8 grid gap-4">
        <Link
          href="/admin/verifications"
          className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-white">Selfie Verificaties</h2>
              <p className="mt-2 text-sm text-white/70">
                Keur nieuwe verificatie-aanvragen goed of af.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {pendingCount > 0 ? (
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-50">
                  {pendingCount} pending
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white/70">
                  0 pending
                </span>
              )}
              <span className="text-white/60">→</span>
            </div>
          </div>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-medium text-white">Security</h2>
          <p className="mt-2 text-sm text-white/70">
            From here you can review suspicious activity events and device fingerprints (next step).
          </p>
        </div>
      </div>
    </main>
  );
}