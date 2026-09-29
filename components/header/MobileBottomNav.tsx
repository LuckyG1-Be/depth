"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Badge, ChatIcon, HeartIcon, PersonIcon, SearchIcon } from "@/components/header/HeaderIcons";
import { cls } from "@/components/header/HeaderTypes";
import { useNotificationSummary } from "@/components/header/useNotificationSummary";

function MobileNavItem({ href, active, label, children, badge = 0 }: { href: string; active: boolean; label: string; children: ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cls(
        "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[22px] border px-1 text-[10.5px] font-semibold transition active:scale-95",
        active
          ? "border-emerald-300/45 bg-[#272332] text-white shadow-[0_0_0_1px_rgba(102,185,108,0.14),0_0_28px_rgba(102,185,108,0.16)]"
          : "border-white/16 bg-[#24202d] text-white/70 hover:border-white/22 hover:bg-[#2b2635] hover:text-white/88"
      )}
    >
      <span className="relative inline-flex h-[23px] items-center justify-center scale-[0.88]">
        {children}
        <Badge count={badge} small />
      </span>
      <span>{label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const { summary } = useNotificationSummary(true);

  const counts = summary.counts || {};
  const unread = Math.max(0, Number(counts.unreadMessages || 0));
  const newMatches = Math.max(0, Number(counts.newMatches || 0));
  const likes = Math.max(0, Number(counts.totalLikes || 0));
  const chatBadge = Math.min(99, unread + newMatches);

  const activeDiscover = pathname.startsWith("/discover");
  const activeChat = pathname.startsWith("/chat");
  const activeLikes = pathname.startsWith("/likes");
  const activeProfile = pathname.startsWith("/profile") || pathname.startsWith("/account") || pathname.startsWith("/wallet") || pathname.startsWith("/onboarding");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/18 bg-[#15131d] px-2.5 pb-[calc(0.58rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-20px_58px_rgba(0,0,0,0.80)] backdrop-blur-xl md:hidden"
      aria-label="Hoofdnavigatie"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5">
        <MobileNavItem href="/discover" active={activeDiscover} label="Discover">
          <SearchIcon />
        </MobileNavItem>

        <MobileNavItem href="/chat" active={activeChat} label="Chat" badge={chatBadge}>
          <ChatIcon />
        </MobileNavItem>

        <MobileNavItem href="/likes" active={activeLikes} label="Likes" badge={likes}>
          <HeartIcon />
        </MobileNavItem>

        <MobileNavItem href="/profile" active={activeProfile} label="Profiel">
          <PersonIcon />
        </MobileNavItem>
      </div>
    </nav>
  );
}
