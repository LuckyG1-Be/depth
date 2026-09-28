"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const GREEN = "#66b96c";
const BG = "#1e1b27";

const HIDE_NAV_PREFIXES = ["/login", "/register", "/verify"];

function IconBtn({
  href,
  active,
  children,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={[
        "group inline-flex items-center justify-center",
        "h-11 w-11 rounded-3xl sm:h-14 sm:w-14",
        "border-2",
        "transition-transform duration-150",
        "hover:scale-105 active:scale-95",
      ].join(" ")}
      style={{
        borderColor: GREEN,
        background: "transparent",
      }}
    >
      <span
        className={[
          "transition-opacity duration-150",
          active ? "opacity-100" : "opacity-90 group-hover:opacity-100",
        ].join(" ")}
      >
        {children}
      </span>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PlusIcon() {
  return <span className="text-xl font-bold" style={{ color: GREEN }}>✦</span>;
}

function HeartIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>;
}

function HeartPill({ count }: { count: number }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2",
        "h-11 rounded-3xl px-3 sm:h-14 sm:gap-3 sm:px-5",
        "border-2",
        "select-none",
      ].join(" ")}
      style={{ borderColor: GREEN, background: "transparent" }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>

      <div className="text-lg font-semibold sm:text-xl" style={{ color: "white" }}>
        {count}
      </div>
    </div>
  );
}

function MobileNavItem({ href, label, active, badge, children }: { href: string; label: string; active: boolean; badge?: number; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={active ? "text-emerald-200" : "text-white/55"}>
      <span className="relative flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-semibold">
        {children}
        {badge && badge > 0 ? <span className="absolute right-1 top-0 inline-flex min-w-4 items-center justify-center rounded-full bg-emerald-300 px-1 text-[10px] font-bold text-[#1e1b27]">{badge > 99 ? "99+" : badge}</span> : null}
        <span>{label}</span>
      </span>
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname() || "/";
  const hide = HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  const [likes, setLikes] = useState<number>(0);
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    if (hide) return;

    let cancelled = false;
    async function load() {
      const res = await fetch("/api/likes/count", { cache: "no-store" }).catch(() => null);
      if (!res || !res.ok) return;
      const data = await res.json().catch(() => null);
      if (!cancelled && data && typeof data.count === "number") setLikes(data.count);
    }
    void load();

    // (optioneel) refresh elke 30s
    const t = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [hide]);

  useEffect(() => {
    if (hide) return;

    let cancelled = false;

    async function loadUnread() {
      const res = await fetch("/api/chat/unread-count", { cache: "no-store" }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (cancelled) return;
      if (res?.ok && data && typeof data.count === "number") setUnread(data.count);
    }

    void loadUnread();

    const onChange = () => void loadUnread();
    window.addEventListener("depth:unread-changed", onChange);
    window.addEventListener("focus", onChange);

    const t = setInterval(() => void loadUnread(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener("depth:unread-changed", onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [hide]);

  if (hide) return null;

  const activeDiscover = pathname.startsWith("/discover");
  const activeChat = pathname.startsWith("/chat");
  const activeProfile = pathname.startsWith("/profile");
  const activeMatches = pathname.startsWith("/matches");
  const isLanding = pathname === "/";

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: BG,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-4 sm:px-6 sm:py-6">
        {/* Left: logo + tagline */}
        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-5">
          <img src="/depth-logo.svg" alt="Depth" className="h-10 w-auto shrink-0 sm:h-20" />
          <div className="hidden sm:block">
            <div className="text-lg font-medium" style={{ color: GREEN }}>
            </div>
          </div>
        </div>

        {/* Right: context action + icons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={isLanding ? "/register" : "/safety"}
            className={isLanding
              ? "inline-flex min-h-11 items-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#1e1b27] transition hover:bg-emerald-100"
              : "inline-flex min-h-11 items-center rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"}
          >
            {isLanding ? "Start gratis" : "Veiligheid"}
          </Link>

          <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
          <IconBtn href="/discover" active={activeDiscover} label="Discover">
            <SearchIcon />
          </IconBtn>

          <IconBtn href="/chat" active={activeChat} label="Chat">
            <div className="relative">
              <ChatIcon />
              {unread > 0 ? (
                <div
                  className="absolute -right-2 -top-2 min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold"
                  style={{ background: GREEN, color: BG }}
                >
                  {unread > 99 ? "99+" : unread}
                </div>
              ) : null}
            </div>
          </IconBtn>

          <IconBtn href="/plus" active={pathname.startsWith("/plus")} label="Depth Plus">
            <PlusIcon />
          </IconBtn>

          {/* Not clickable */}
          <HeartPill count={likes} />

          <IconBtn href="/profile" active={activeProfile} label="Profiel">
            <PersonIcon />
          </IconBtn>
          </nav>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#1e1b27]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <MobileNavItem href="/discover" label="Discover" active={activeDiscover}><SearchIcon /></MobileNavItem>
          <MobileNavItem href="/matches" label="Likes" active={activeMatches} badge={likes}><HeartIcon /></MobileNavItem>
          <MobileNavItem href="/chat" label="Chat" active={activeChat} badge={unread}><ChatIcon /></MobileNavItem>
          <MobileNavItem href="/profile" label="Profiel" active={activeProfile}><PersonIcon /></MobileNavItem>
        </div>
      </nav>
    </header>
  );
}
