import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import DatingPreferencesForm from "@/components/PreferencesForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PreferencesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Datingvoorkeuren</h2>
          <p className="mt-1 text-sm opacity-70">Deze instellingen bepalen welke profielen je ziet in Discover.</p>
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Naar Discover
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <DatingPreferencesForm variant="page" />
      </div>
    </div>
  );
}