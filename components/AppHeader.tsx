"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TokenBalancePill from "@/components/TokenBalancePill";
import { Badge, ChatIcon, HeartIcon, IconBtn, PersonIcon, SearchIcon } from "@/components/header/HeaderIcons";
import { BG } from "@/components/header/HeaderTypes";
import { useNotificationSummary } from "@/components/header/useNotificationSummary";

// MobileBottomNav is rendered by AppShell so the app navigation stays sticky at the bottom.
// Header keeps /wallet and /onboarding reachable through profile/account flows.
const HIDE_HEADER_PREFIXES = ["/login", "/register", "/verify", "/admin"];

export default function AppHeader() {
  const pathname = usePathname() || "/";
  const hide = HIDE_HEADER_PREFIXES.some((p) => pathname.startsWith(p));
  const { summary } = useNotificationSummary(!hide);

  if (hide) return null;

  const counts = summary.counts || {};
  const unread = Math.max(0, Number(counts.unreadMessages || 0));
  const likes = Math.max(0, Number(counts.totalLikes || 0));
  const newMatches = Math.max(0, Number(counts.newMatches || 0));
  const chatBadge = Math.min(99, unread + newMatches);

  const activeDiscover = pathname.startsWith("/discover");
  const activeChat = pathname.startsWith("/chat");
  const activeLikes = pathname.startsWith("/likes");
  const activeProfile =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/wallet");

  return (
    <header className="sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)]" style={{ background: BG, borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 md:px-6 md:py-4">
        <Link href="/discover" aria-label="Naar Discover" className="block shrink-0 overflow-hidden">
          <span className="block h-[52px] w-[148px] overflow-hidden sm:h-[58px] sm:w-[168px] md:h-auto md:w-auto md:overflow-visible">
            <img src="/depth-logo.svg" alt="Depth" className="h-[58px] w-auto -translate-y-1 sm:h-[64px] md:h-14 md:translate-y-0" />
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <TokenBalancePill compact />

          <nav className="hidden items-center gap-3 md:flex" aria-label="Hoofdnavigatie">
            <IconBtn href="/discover" active={activeDiscover} label="Discover">
              <SearchIcon />
            </IconBtn>

            <IconBtn href="/chat" active={activeChat} label="Chat">
              <div className="relative">
                <ChatIcon />
                <Badge count={chatBadge} />
              </div>
            </IconBtn>

            <IconBtn href="/likes" active={activeLikes} label="Likes">
              <div className="relative">
                <HeartIcon />
                <Badge count={likes} />
              </div>
            </IconBtn>

            <IconBtn href="/profile" active={activeProfile} label="Profiel">
              <PersonIcon />
            </IconBtn>
          </nav>
        </div>
      </div>
    </header>
  );
}
