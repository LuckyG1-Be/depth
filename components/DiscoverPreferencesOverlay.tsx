"use client";

import { useEffect, useState } from "react";
import DatingPreferencesForm from "@/components/PreferencesForm";

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
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        aria-label="Datingvoorkeuren"
      >
        <span aria-hidden>⚙️</span>
        Datingvoorkeuren
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
            aria-label="Sluiten"
          />

          <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#1e1b27] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-2 pb-3">
              <div>
                <div className="text-lg font-semibold">Datingvoorkeuren</div>
                <div className="text-sm opacity-70">Deze instellingen gelden ook voor Discover.</div>
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

            <div className="max-h-[70vh] overflow-auto p-2">
              <DatingPreferencesForm variant="modal" onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}