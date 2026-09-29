"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { value: "BUG", label: "Bug melden" },
  { value: "FEEDBACK", label: "Algemene feedback" },
  { value: "MATCHING", label: "Matchvoorstel klopt niet" },
  { value: "PROFILE", label: "Profiel/onboarding" },
  { value: "VERIFICATION", label: "Verificatieprobleem" },
  { value: "PAYMENT", label: "Betaalprobleem" },
];

type SubmitState = "idle" | "busy" | "done" | "error";

type FeedbackButtonProps = {
  variant?: "default" | "card";
  label?: string;
};

export default function FeedbackButton({ variant = "default", label = "Feedback geven" }: FeedbackButtonProps) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("FEEDBACK");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const clean = message.trim();
    if (clean.length < 10) {
      setError("Schrijf minstens 10 tekens, zodat we je feedback kunnen begrijpen.");
      return;
    }

    setState("busy");
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category, message: clean, screen: pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(String(data?.error || "FEEDBACK_FAILED"));

      setState("done");
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setState("idle");
      }, 1100);
    } catch {
      setState("error");
      setError("Feedback versturen lukt niet. Probeer opnieuw.");
    }
  }

  const trigger = variant === "card" ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white/82 transition hover:bg-white/10 active:scale-[0.99]"
      title="Feedback geven"
    >
      <span className="block text-white">{label}</span>
      <span className="mt-1 block text-xs font-normal leading-5 text-white/50">Meld een bug of zeg kort wat beter kan.</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex h-12 items-center rounded-3xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white active:scale-95"
      title="Feedback geven"
    >
      Feedback
    </button>
  );

  return (
    <>
      {trigger}

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 px-3 pb-3 pt-16 backdrop-blur-sm sm:items-center sm:px-4 sm:pb-16" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#171421] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-base font-semibold text-white">Feedback voor Depth</div>
                <p className="mt-1 text-sm text-white/55">Kort is genoeg. We koppelen dit automatisch aan dit scherm.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/60 hover:bg-white/10">
                Sluiten
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Type</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/35"
                >
                  {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Bericht</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1500))}
                  rows={6}
                  placeholder="Wat gebeurde er? Wat had je verwacht?"
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-emerald-300/35"
                />
                <span className="mt-1 block text-right text-xs text-white/35">{message.length}/1500</span>
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/45">Scherm: {pathname}</div>

              {error ? <div className="rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-50">{error}</div> : null}
              {state === "done" ? <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">Bedankt, je feedback is opgeslagen.</div> : null}

              <button
                type="button"
                disabled={state === "busy" || state === "done"}
                onClick={() => void submit()}
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#102016] transition hover:bg-emerald-300 disabled:opacity-60"
              >
                {state === "busy" ? "Versturen..." : state === "done" ? "Verstuurd" : "Feedback versturen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
