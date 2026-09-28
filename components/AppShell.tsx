"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { ToastProvider } from "@/components/ToastProvider";

const HIDE_NAV_PREFIXES = ["/login", "/register", "/verify"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hide = HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <ToastProvider>
      <div className={`min-h-screen bg-[#1e1b27] text-white ${hide ? "" : "pb-20 md:pb-0"}`}>
        {!hide ? <AppHeader /> : null}
        {children}
      </div>
    </ToastProvider>
  );
}
