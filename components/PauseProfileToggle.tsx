"use client";

import { useState } from "react";

export default function PauseProfileToggle({ initialPaused }: { initialPaused: boolean }) {
  const [paused, setPaused] = useState(initialPaused);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const next = !paused;
      const res = await fetch("/api/profile/pause", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paused: next }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Opslaan mislukt");
      setPaused(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Profiel {paused ? "gepauzeerd" : "actief"}</div>
          <div className="mt-1 text-xs opacity-65">{paused ? "Je wordt tijdelijk niet voorgesteld." : "Je profiel kan in Discover verschijnen."}</div>
        </div>
        <button type="button" onClick={() => void toggle()} disabled={busy} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">
          {busy ? "Opslaan…" : paused ? "Profiel hervatten" : "Profiel pauzeren"}
        </button>
      </div>
      {error ? <div className="mt-2 text-xs text-red-200">{error}</div> : null}
    </div>
  );
}
