"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname?.startsWith("/profile/preferences") ? "preferences" : "me";

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Profiel</h1>
        <p className="text-sm opacity-70">Beheer je identiteit en je datingvoorkeuren.</p>
      </div>

      {/* Tabs */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-2">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/profile/me"
            className={cls(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              active === "me"
                ? "border border-white/15 bg-white/10 text-white"
                : "border border-transparent bg-transparent text-white/80 hover:bg-white/10"
            )}
          >
            Mijn profiel
          </Link>
          <Link
            href="/profile/preferences"
            className={cls(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              active === "preferences"
                ? "border border-white/15 bg-white/10 text-white"
                : "border border-transparent bg-transparent text-white/80 hover:bg-white/10"
            )}
          >
            Datingvoorkeuren
          </Link>
        </div>
      </div>

      <div className="mt-8">{children}</div>
    </main>
  );
}