"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function TopNav() {
  const pathname = usePathname();

  const item = (href: string, label: string) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));
    return (
      <Link
        href={href}
        className={cls(
          "rounded-xl px-4 py-2 text-sm transition",
          active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/discover" className="font-semibold tracking-tight">
          Depth
        </Link>

        <nav className="flex items-center gap-2">
          {item("/discover", "Discover")}
          {item("/chat", "Chat")}
          {item("/profile", "Profiel")}
          {item("/logout", "Logout")}
        </nav>
      </div>
    </div>
  );
}
