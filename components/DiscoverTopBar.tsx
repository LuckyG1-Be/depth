"use client";

import { useEffect, useRef, useState } from "react";
import DatingPreferencesForm from "@/components/PreferencesForm";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 12a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1l-.4-2.5H9.2l-.4 2.5a8 8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h5.6l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DiscoverTopBar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (panelRef.current && panelRef.current.contains(t)) return;
      setOpen(false);
    }
    if (open) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>{children}</div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cls(
            "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
            "border-white/10 bg-white/5 hover:bg-white/10"
          )}
        >
          <GearIcon />
          Datingvoorkeuren
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
            <div
              ref={panelRef}
              className="rounded-3xl border border-white/10 bg-[#1e1b27]/95 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
                <div>
                  <div className="text-lg font-semibold">Datingvoorkeuren</div>
                  <div className="mt-1 text-sm opacity-70">Wijzig dit en Discover past zich meteen aan.</div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                >
                  Sluiten
                </button>
              </div>

              <div className="p-6">
                <DatingPreferencesForm variant="modal" onClose={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
