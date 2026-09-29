"use client";

import { useState } from "react";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function AccountPauseCard({ initialPaused }: { initialPaused: boolean }) {
  const [paused, setPaused] = useState(initialPaused);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "pause" | "resume") {
    setBusy(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/account/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);

    const data = await res?.json().catch(() => null);
    setBusy(false);

    if (!res?.ok || !data?.ok) {
      setError("Deze actie kon niet worden uitgevoerd. Probeer later opnieuw.");
      return;
    }

    setPaused(Boolean(data.paused));
    setMessage(action === "pause" ? "Je account is gepauzeerd. Je verschijnt nu niet in Discover." : "Je account is opnieuw actief.");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Zichtbaarheid</div>
          <h2 className="mt-1 text-lg font-semibold text-white sm:mt-2 sm:text-xl">Account pauzeren</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-white/70 sm:mt-2 sm:text-sm sm:leading-6">
            Pauzeer je account wanneer je tijdelijk niet in Discover wil verschijnen. Je bestaande matches en chats blijven bewaard, maar nieuwe gebruikers kunnen je profiel niet ontdekken tot je opnieuw activeert.
          </p>
        </div>

        <div
          className={cls(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            paused ? "border-amber-300/30 bg-amber-400/10 text-amber-50" : "border-emerald-300/30 bg-emerald-400/10 text-emerald-50"
          )}
        >
          {paused ? "Gepauzeerd" : "Actief"}
        </div>
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">{message}</div> : null}
      {error ? <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-50">{error}</div> : null}

      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        {paused ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("resume")}
            className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Bezig..." : "Account opnieuw activeren"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("pause")}
            className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Bezig..." : "Account pauzeren"}
          </button>
        )}
      </div>
    </section>
  );
}
