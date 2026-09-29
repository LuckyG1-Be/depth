"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BG, GREEN, cls } from "@/components/header/HeaderTypes";

export function IconBtn({
  href,
  active,
  children,
  label,
  className,
}: {
  href: string;
  active: boolean;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cls(
        "group relative inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5",
        "transition hover:bg-white/10 active:scale-95 md:h-12 md:w-12",
        active && "border-emerald-300/25 bg-emerald-400/10 shadow-[0_0_0_3px_rgba(102,185,108,0.10)]",
        className
      )}
      title={label}
    >
      <span className={cls("transition-opacity", active ? "opacity-100" : "opacity-82 group-hover:opacity-100")}>{children}</span>
    </Link>
  );
}

export function SearchIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function PersonIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function DepthTokenIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke={GREEN} strokeWidth="1.8" opacity="0.95" />
      <path
        d="M12 5.2c1.7-1.55 4.45-1.35 5.9.38 1.34 1.6 1.2 4.02-.27 5.5L12 16.4l-5.63-5.3c-1.47-1.48-1.6-3.9-.27-5.5 1.45-1.73 4.2-1.93 5.9-.38Z"
        stroke={GREEN}
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <circle cx="18.4" cy="7.3" r="1.1" fill={GREEN} opacity="0.9" />
      <circle cx="6.2" cy="16.8" r="0.9" fill={GREEN} opacity="0.55" />
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function Badge({ count, small = false }: { count: number; small?: boolean }) {
  if (count <= 0) return null;
  return (
    <div
      className={cls(
        "absolute rounded-full text-center font-semibold shadow-sm",
        small ? "-right-1 -top-1 min-w-[18px] px-1 py-0 text-[10px]" : "-right-2 -top-2 min-w-[20px] px-1.5 py-0.5 text-[11px]"
      )}
      style={{ background: GREEN, color: BG }}
    >
      {count > 99 ? "99+" : count}
    </div>
  );
}
