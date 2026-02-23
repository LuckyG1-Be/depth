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
        "h-14 w-14 rounded-3xl",
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

function HeartPill({ count }: { count: number }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-3",
        "h-14 rounded-3xl px-5",
        "border-2",
        "select-none",
      ].join(" ")}
      style={{ borderColor: GREEN, background: "transparent" }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>

      <div className="text-xl font-semibold" style={{ color: "white" }}>
        {count}
      </div>
    </div>
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

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: BG,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        {/* Left: logo + tagline */}
        <div className="flex items-center gap-5">
          <img src="/depth-logo.svg" alt="Depth" className="h-20 w-auto" />
          <div className="hidden sm:block">
            <div className="text-lg font-medium" style={{ color: GREEN }}>
            </div>
          </div>
        </div>

        {/* Right: icons */}
        <nav className="flex items-center gap-4">
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

          {/* Not clickable */}
          <HeartPill count={likes} />

          <IconBtn href="/profile" active={activeProfile} label="Profiel">
            <PersonIcon />
          </IconBtn>
        </nav>
      </div>
    </header>
  );
}
