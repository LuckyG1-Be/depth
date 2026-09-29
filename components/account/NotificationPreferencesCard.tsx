"use client";

import { useState } from "react";
import type { NotificationPreferenceChannel, NotificationPreferenceKey, NotificationPreferences } from "@/lib/notificationPreferences";

const NOTIFICATION_PREF_KEYS: NotificationPreferenceKey[] = ["chat", "matches", "likes", "verification", "wallet", "safety", "product"];

const NOTIFICATION_PREF_LABELS: Record<NotificationPreferenceKey, { title: string; description: string }> = {
  chat: { title: "Chatberichten", description: "Nieuwe berichten en actieve gesprekken." },
  matches: { title: "Matches", description: "Nieuwe matches en match-wachtrij." },
  likes: { title: "Likes & dieptesignalen", description: "Ontvangen likes en superlikes." },
  verification: { title: "Verificatie", description: "Goedkeuring, afwijzing of opnieuw indienen." },
  wallet: { title: "Wallet & betalingen", description: "Aankopen, tokens en open betalingen." },
  safety: { title: "Safety", description: "Reports, blokkeringen of tijdelijke chatbeperkingen." },
  product: { title: "Depth-updates", description: "Rustige product- en bèta-updates." },
};

type Props = {
  initialPreferences: NotificationPreferences;
};

function clonePrefs(prefs: NotificationPreferences): NotificationPreferences {
  return {
    inApp: { ...prefs.inApp },
    email: { ...prefs.email },
  };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={checked ? "rounded-full border border-emerald-300/25 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-50" : "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/50"}
    >
      {checked ? "Aan" : "Uit"}
    </button>
  );
}

export default function NotificationPreferencesCard({ initialPreferences }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => clonePrefs(initialPreferences));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update(channel: NotificationPreferenceChannel, key: NotificationPreferenceKey, value: boolean) {
    setPrefs((current) => ({ ...current, [channel]: { ...current[channel], [key]: value } }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "FAILED");
      setPrefs(clonePrefs(data.preferences));
      setMessage("Voorkeuren opgeslagen.");
      window.dispatchEvent(new Event("depth:notifications"));
    } catch {
      setMessage("Opslaan is niet gelukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#151320] p-4 sm:rounded-3xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Meldingsvoorkeuren</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-white/60 sm:mt-2 sm:text-sm sm:leading-6">
            Kies welke meldingen je in de app en per e-mail wil ontvangen. Kritieke veiligheids- en accountmails kunnen we nog steeds sturen wanneer dat nodig is.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {saving ? "Opslaan…" : "Opslaan"}
        </button>
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">{message}</div> : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 sm:mt-5">
        <div className="grid grid-cols-[1fr_64px_64px] gap-0 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 sm:grid-cols-[1fr_82px_82px] sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.16em]">
          <div>Melding</div>
          <div className="text-center">In-app</div>
          <div className="text-center">E-mail</div>
        </div>
        {NOTIFICATION_PREF_KEYS.map((key) => {
          const label = NOTIFICATION_PREF_LABELS[key];
          return (
            <div key={key} className="grid grid-cols-[1fr_64px_64px] gap-0 border-b border-white/10 px-3 py-3 last:border-b-0 sm:grid-cols-[1fr_82px_82px] sm:px-4 sm:py-4">
              <div className="pr-3">
                <div className="text-sm font-semibold text-white/90">{label.title}</div>
                <div className="mt-1 text-xs leading-5 text-white/50">{label.description}</div>
              </div>
              <div className="flex items-center justify-center">
                <Toggle checked={prefs.inApp[key]} onChange={(next) => update("inApp", key, next)} />
              </div>
              <div className="flex items-center justify-center">
                <Toggle checked={prefs.email[key]} onChange={(next) => update("email", key, next)} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
