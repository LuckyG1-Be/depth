"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Reason =
  | "HARASSMENT"
  | "SEXUAL_CONTENT"
  | "SCAM"
  | "IMPERSONATION"
  | "UNDERAGE"
  | "HATE"
  | "VIOLENCE"
  | "OTHER";

const REASONS: Array<{ key: Reason; label: string; help: string }> = [
  { key: "HARASSMENT", label: "Pesterijen / intimidatie", help: "Beledigingen, druk zetten, bedreigingen." },
  { key: "SEXUAL_CONTENT", label: "Seksuele content", help: "Ongepaste of expliciete seksuele berichten." },
  { key: "SCAM", label: "Oplichting / scam", help: "Geld vragen, crypto, Telegram/WhatsApp push, links." },
  { key: "IMPERSONATION", label: "Identiteitsfraude", help: "Doet zich voor als iemand anders." },
  { key: "UNDERAGE", label: "Minderjarig", help: "Je vermoedt dat dit profiel minderjarig is." },
  { key: "HATE", label: "Haat / discriminatie", help: "Racisme, haatspraak, extremistischer taal." },
  { key: "VIOLENCE", label: "Geweld", help: "Dreigementen of geweldverheerlijking." },
  { key: "OTHER", label: "Andere reden", help: "Iets anders dat onveilig of ongepast is." },
];

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function TriangleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5l10 17.3a1.2 1.2 0 0 1-1.04 1.8H3.04A1.2 1.2 0 0 1 2 20.8L12 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17.2h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function SafetyMenu({
  otherUserId,
  context,
  className,
}: {
  otherUserId: string;
  context?: "discover" | "chat" | "profile";
  className?: string;
  align?: "left" | "right";
}) {
  const { toast } = useToast();
  const router = useRouter();

  const btnRef = useRef<HTMLButtonElement | null>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "report" | "block">("menu");
  const [reason, setReason] = useState<Reason>("HARASSMENT");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  // ✅ defaults ON
  const [blockImmediately, setBlockImmediately] = useState(true);
  const [includeLast20, setIncludeLast20] = useState(true);

  const reasonMeta = useMemo(() => REASONS.find((r) => r.key === reason), [reason]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function resetState() {
    setMode("menu");
    setReason("HARASSMENT");
    setDetails("");
    setBusy(false);
    setBlockImmediately(true);
    setIncludeLast20(true);
  }

  async function doReport() {
    setBusy(true);
    try {
      const res = await fetch("/api/matches/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherUserId,
          reasonCode: reason,
          details,
          blockImmediately,
          includeLastMessages: includeLast20,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "REPORT_FAILED");

      toast({ kind: "success", title: "Rapport ontvangen", message: "Bedankt. We kijken dit na." });
      setOpen(false);
      resetState();

      if (blockImmediately) {
        if (context === "chat") router.push("/chat");
        else router.refresh();
      }
    } catch (e: any) {
      toast({ kind: "error", title: "Rapporteren mislukt", message: e?.message || "Probeer opnieuw." });
    } finally {
      setBusy(false);
    }
  }

  async function doBlock() {
    setBusy(true);
    try {
      const res = await fetch("/api/matches/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "BLOCK_FAILED");

      toast({ kind: "success", title: "Geblokkeerd", message: "Dit profiel kan je niet meer zien of contacteren." });
      setOpen(false);
      resetState();

      if (context === "chat") router.push("/chat");
      else router.refresh();
    } catch (e: any) {
      toast({ kind: "error", title: "Blokkeren mislukt", message: e?.message || "Probeer opnieuw." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setMode("menu");
        }}
        className={cls(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80",
          "hover:bg-black/40",
          className
        )}
        aria-label="Rapporteren of blokkeren"
        title="Rapporteren of blokkeren"
      >
        <TriangleIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} aria-label="Sluiten" type="button" />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-[min(380px,92vw)] rounded-3xl border border-white/10 bg-[#1e1b27] shadow-2xl">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-white/90">Veiligheid</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/80 hover:bg-white/10"
                  aria-label="Sluiten"
                  title="Sluiten"
                >
                  ✕
                </button>
              </div>

              {mode === "menu" && (
                <div className="grid gap-3 px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => setMode("report")}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10"
                  >
                    <div className="font-semibold">Rapporteren</div>
                    <div className="mt-1 text-sm opacity-70">Meld ongepast gedrag of inhoud.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("block")}
                    className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-left hover:bg-red-500/15"
                  >
                    <div className="font-semibold text-red-100">Blokkeren</div>
                    <div className="mt-1 text-sm text-red-100/70">Verberg dit profiel en stop contact.</div>
                  </button>

                  <div className="text-xs text-white/55">Blokkeren is stil — de andere persoon krijgt geen melding.</div>
                </div>
              )}

              {mode === "report" && (
                <div className="grid gap-4 px-4 pb-4">
                  <div className="grid gap-2">
                    <div className="text-sm font-semibold">Reden</div>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as Reason)}
                      className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                    >
                      {REASONS.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs opacity-65">{reasonMeta?.help}</div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm font-semibold">Extra info (optioneel)</div>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={4}
                      maxLength={600}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                      placeholder="Wat is er gebeurd? (max 600 tekens)"
                    />
                  </div>

                  <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/85">
                        Block meteen <span className="text-white/50">(aanbevolen)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={blockImmediately}
                        onChange={(e) => setBlockImmediately(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/85">
                        Include last 20 messages <span className="text-white/50">(privacy: redacted)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={includeLast20}
                        onChange={(e) => setIncludeLast20(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("menu")}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                      disabled={busy}
                    >
                      Terug
                    </button>
                    <button
                      type="button"
                      onClick={doReport}
                      className="rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                      disabled={busy}
                    >
                      {busy ? "Versturen..." : "Rapport versturen"}
                    </button>
                  </div>

                  <div className="text-[11px] text-white/55">
                    We gebruiken je rapport om veiligheid te verbeteren. Berichten in evidence worden automatisch beperkt/redacted.
                  </div>
                </div>
              )}

              {mode === "block" && (
                <div className="grid gap-4 px-4 pb-4">
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100/90">
                    Ben je zeker dat je dit profiel wil blokkeren? Je ziet elkaar niet meer in Discover en berichten stoppen.
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("menu")}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                      disabled={busy}
                    >
                      Terug
                    </button>
                    <button
                      type="button"
                      onClick={doBlock}
                      className="rounded-2xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      disabled={busy}
                    >
                      {busy ? "Blokkeren..." : "Blokkeer"}
                    </button>
                  </div>

                  <div className="text-xs text-white/55">Blokkeren is stil — de andere persoon krijgt geen melding.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}