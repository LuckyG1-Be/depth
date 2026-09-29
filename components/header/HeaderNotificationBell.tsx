"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { BellIcon, Badge } from "@/components/header/HeaderIcons";
import { cls, type NotificationItem, type NotificationSummary, type NotificationTone } from "@/components/header/HeaderTypes";

function toneDot(tone: NotificationTone) {
  if (tone === "chat") return "bg-emerald-300";
  if (tone === "match") return "bg-sky-300";
  if (tone === "like") return "bg-pink-300";
  if (tone === "wallet") return "bg-amber-300";
  if (tone === "verify") return "bg-violet-300";
  return "bg-white/50";
}

function toneLabel(tone: NotificationTone) {
  if (tone === "chat") return "Chat";
  if (tone === "match") return "Match";
  if (tone === "like") return "Like";
  if (tone === "wallet") return "Wallet";
  if (tone === "verify") return "Verificatie";
  return "Systeem";
}

async function markRead(args: { ids?: string[]; type?: string }) {
  const res = await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  }).catch(() => null);

  if (res?.ok) window.dispatchEvent(new CustomEvent("depth:notifications-changed"));
}

function NotificationRow({ item, onClose }: { item: NotificationItem; onClose: () => void }) {
  function onMarkRead(e: ReactMouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!item.notificationId) return;
    void markRead({ ids: [item.notificationId] });
  }

  return (
    <div className="group flex gap-3 px-4 py-3 transition hover:bg-white/[0.04]">
      <Link href={item.href || "/"} onClick={onClose} className="flex min-w-0 flex-1 gap-3">
        <span className={cls("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", toneDot(item.tone))} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white/90">{item.title}</span>
            {typeof item.count === "number" && item.count > 0 ? <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70">{item.count > 99 ? "99+" : item.count}</span> : null}
          </span>
          <span className="mt-1 inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42">{toneLabel(item.tone)}</span>
          {item.description ? <span className="mt-1.5 block text-xs leading-5 text-white/55">{item.description}</span> : null}
        </span>
      </Link>
      {item.notificationId ? (
        <button
          type="button"
          onClick={onMarkRead}
          className="self-start rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/50 opacity-100 transition hover:bg-white/10 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
          title="Markeer als gelezen"
        >
          gelezen
        </button>
      ) : null}
    </div>
  );
}

export function NotificationBell({ summary, loading }: { summary: NotificationSummary; loading: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const badgeCount = Math.max(0, Number(summary.badgeCount || 0));
  const items = Array.isArray(summary.items) ? summary.items : [];
  const storedIds = items.map((item) => item.notificationId).filter((id): id is string => Boolean(id));

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: globalThis.MouseEvent) => {
      const target = e.target instanceof Node ? e.target : null;
      if (target && ref.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  function markAllStoredRead() {
    if (!storedIds.length) return;
    void markRead({ ids: storedIds });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Meldingen"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-3xl border border-white/10 bg-white/5 transition hover:bg-white/10 active:scale-95 md:h-12 md:w-12"
        title="Meldingen"
      >
        <BellIcon />
        <Badge count={badgeCount} small />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#171421] shadow-2xl">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Meldingen</div>
                <div className="mt-0.5 text-xs text-white/45">Alles wat aandacht vraagt.</div>
              </div>
              <div className="flex items-center gap-2">
                {storedIds.length ? (
                  <button type="button" onClick={markAllStoredRead} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/55 hover:bg-white/10 hover:text-white">
                    Alles gelezen
                  </button>
                ) : null}
                {loading ? <div className="text-xs text-white/40">laden…</div> : null}
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-white/60">
              <div className="font-semibold text-white/82">Je bent mee.</div>
              <div className="mt-1 text-xs leading-5 text-white/48">Nieuwe matches, berichten en walletupdates verschijnen hier.</div>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-auto py-2">
              {items.map((item) => (
                <NotificationRow key={item.key} item={item} onClose={() => setOpen(false)} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
