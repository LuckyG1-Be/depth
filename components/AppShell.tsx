"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { ToastProvider } from "@/components/ToastProvider";
import BootOverlays from "@/components/BootOverlays";
import { PremiumProvider } from "@/components/premium/PremiumProvider";
import { MobileBottomNav } from "@/components/header/MobileBottomNav";

const HIDE_CHROME_PREFIXES = ["/login", "/register", "/verify", "/admin"];

function isChatDetail(pathname: string) {
  return /^\/chat\/[^/]+/.test(pathname);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isInstallGate = pathname === "/";
  const hideChrome = HIDE_CHROME_PREFIXES.some((p) => pathname.startsWith(p));
  const hideGlobalChrome = isInstallGate || hideChrome || isChatDetail(pathname);

  return (
    <ToastProvider>
      <PremiumProvider>
        <div className="min-h-screen bg-[#1e1b27] text-white">
          <BootOverlays />
          {!hideGlobalChrome ? <AppHeader /> : null}
          {children}
          {!hideGlobalChrome ? <MobileBottomNav /> : null}
        </div>
      </PremiumProvider>
    </ToastProvider>
  );
}
