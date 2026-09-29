"use client";

import { useEffect, useState } from "react";
import DatingPreferencesForm from "@/components/PreferencesForm";

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h8" />
      <path d="M16 7h4" />
      <path d="M14 5v4" />
      <path d="M4 17h4" />
      <path d="M12 17h8" />
      <path d="M10 15v4" />
    </svg>
  );
}

export default function DiscoverPreferencesOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-3 top-[calc(5.95rem+env(safe-area-inset-top))] z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-[#1b1824] text-white/88 shadow-[0_10px_26px_rgba(0,0,0,0.42)] transition hover:bg-[#24202d] sm:static sm:h-auto sm:w-auto sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm"
        aria-label="Datingvoorkeuren"
        title="Datingvoorkeuren"
      >
        <SlidersIcon />
        <span className="hidden sm:inline">Voorkeuren</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[130]">
          <button
            type="button"
            className="absolute inset-0 bg-black/74 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Sluiten"
          />

          <div className="absolute inset-x-3 bottom-3 top-[calc(1rem+env(safe-area-inset-top))] overflow-hidden rounded-[26px] border border-white/10 bg-[#1e1b27] shadow-2xl sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[88vh] sm:w-[min(720px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <div className="text-base font-semibold sm:text-lg">Datingvoorkeuren</div>
                <div className="text-xs text-white/58 sm:text-sm">Deze instellingen gelden voor Discover.</div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg hover:bg-white/10"
                aria-label="Sluiten"
                title="Sluiten"
              >
                ✕
              </button>
            </div>

            <div className="h-[calc(100%-65px)] overflow-auto p-3 sm:max-h-[70vh] sm:p-4">
              <DatingPreferencesForm variant="modal" onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
