"use client";

import { useState } from "react";

export default function PlusActions({ hasSubscription }: { hasSubscription: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open(path: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(path, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Kon de betaalpagina niet openen.");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <button type="button" onClick={() => void open(hasSubscription ? "/api/billing/portal" : "/api/billing/checkout")} disabled={busy} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">
        {busy ? "Even geduld…" : hasSubscription ? "Abonnement beheren" : "Start Depth Plus"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-200">{error === "BILLING_NOT_CONFIGURED" ? "Betalingen zijn nog niet geactiveerd." : error}</p> : null}
    </div>
  );
}
