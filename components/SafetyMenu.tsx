"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Props = {
  otherUserId?: string | null;
  matchId?: string | null;
  context?: "discover" | "chat" | "profile" | string;
};

type ReportReason =
  | "HARASSMENT"
  | "SEXUAL_CONTENT"
  | "SCAM"
  | "IMPERSONATION"
  | "UNDERAGE"
  | "HATE"
  | "VIOLENCE"
  | "OTHER";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target && el.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, handler]);
}

function toolLabel(kind: string) {
  if (kind === "discover") return "In Discover";
  if (kind === "chat") return "In chat";
  if (kind === "profile") return "Op profiel";
  return "Acties";
}

const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "HARASSMENT", label: "Intimidatie of lastigvallen" },
  { value: "SEXUAL_CONTENT", label: "Ongepaste seksuele inhoud" },
  { value: "SCAM", label: "Oplichting of fraude" },
  { value: "IMPERSONATION", label: "Doet zich voor als iemand anders" },
  { value: "UNDERAGE", label: "Mogelijk minderjarig" },
  { value: "HATE", label: "Haatdragende inhoud" },
  { value: "VIOLENCE", label: "Geweld of dreiging" },
  { value: "OTHER", label: "Iets anders" },
];

export default function SafetyMenu({ otherUserId, matchId, context = "chat" }: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("HARASSMENT");
  const [reportDetails, setReportDetails] = useState("");
  const [blockImmediately, setBlockImmediately] = useState(true);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  useOnClickOutside(wrapRef, () => setOpen(false));

  const canAct = Boolean(otherUserId);
  const isChatContext = context === "chat";
  const reportEndpoint = matchId ? "/api/matches/report" : "/api/match/report";
  const blockEndpoint = matchId ? "/api/matches/block" : "/api/match/block";

  async function handleBlock() {
    if (!otherUserId) return;

    const ok = window.confirm("Deze persoon blokkeren? Jullie zien elkaar niet meer in Discover of chat.");
    if (!ok) return;

    setBusy("block");
    try {
      const res = await fetch(blockEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId, reason: "Geblokkeerd door gebruiker" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(String(data?.error || "BLOCK_FAILED"));
      }

      try {
        window.dispatchEvent(new Event("depth:threads-changed"));
        window.dispatchEvent(new Event("depth:notifications-refresh"));
      } catch {}

      toast({ kind: "success", title: "Geblokkeerd", message: "Deze persoon is geblokkeerd en verborgen." });
      setOpen(false);

      if (isChatContext) {
        router.push("/chat");
        setTimeout(() => router.refresh(), 80);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      toast({ kind: "error", title: "Safety", message: e?.message || "Blokkeren mislukt" });
    } finally {
      setBusy(null);
    }
  }

  async function handleReportSubmit() {
    if (!otherUserId) return;

    setBusy("report");
    try {
      const payload = {
        otherUserId,
        matchId: matchId || undefined,
        reasonCode: reportReason,
        details: reportDetails.trim(),
        blockImmediately,
        includeLastMessages: Boolean(matchId),
      };

      const res = await fetch(reportEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(String(data?.error || "REPORT_FAILED"));
      }

      try {
        window.dispatchEvent(new Event("depth:threads-changed"));
        window.dispatchEvent(new Event("depth:notifications-refresh"));
      } catch {}

      setReportOpen(false);
      setOpen(false);
      setReportReason("HARASSMENT");
      setReportDetails("");
      setBlockImmediately(true);

      toast({
        kind: "success",
        title: "Rapport verzonden",
        message: blockImmediately
          ? "Dank je. Dit profiel is gerapporteerd en meteen verborgen."
          : "Dank je. Dit profiel is gerapporteerd voor review.",
      });

      if (isChatContext && blockImmediately) {
        router.push("/chat");
        setTimeout(() => router.refresh(), 80);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      toast({ kind: "error", title: "Safety", message: e?.message || "Rapporteren mislukt" });
    } finally {
      setBusy(null);
    }
  }

  const items = useMemo(() => {
    const out: Array<{
      key: string;
      title: string;
      desc?: string;
      kind?: "danger" | "neutral";
      onClick?: () => Promise<void> | void;
      disabled?: boolean;
    }> = [];

    if (canAct) {
      out.push({
        key: "report",
        title: "Rapporteren",
        desc: "Meld misbruik. Je kan het profiel meteen verbergen.",
        kind: "danger",
        onClick: () => {
          setOpen(false);
          setReportOpen(true);
        },
      });

      out.push({
        key: "block",
        title: "Blokkeren",
        desc: "Jullie zien elkaar niet meer in Discover of chat.",
        kind: "danger",
        onClick: handleBlock,
      });
    }

    return out;
  }, [canAct, isChatContext, otherUserId, matchId]);

  const renderedItems = (
    <div className={isChatContext ? "space-y-2" : "p-2"}>
      {items.map((it) => {
        const disabled = Boolean(it.disabled) || busy === it.key;

        return (
          <button
            key={it.key}
            type="button"
            onClick={() => it.onClick?.()}
            className={isChatContext ? "block w-full text-left" : "block w-full p-1 text-left"}
            disabled={disabled}
          >
            <div
              className={cls(
                "rounded-2xl border px-3 py-2.5 transition",
                it.kind === "danger"
                  ? "border-rose-300/15 bg-rose-400/5 hover:bg-rose-400/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              <div className={cls("text-sm font-semibold", it.kind === "danger" ? "text-rose-100" : "text-white/85")}>
                {it.title}
              </div>
              {it.desc ? <div className="mt-0.5 text-xs text-white/55">{it.desc}</div> : null}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {isChatContext ? (
        <div ref={wrapRef} className="w-full">
          {renderedItems}
        </div>
      ) : (
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white/80 hover:bg-black/30 sm:h-10 sm:w-10"
            title="Safety"
          >
            <span className="text-base sm:text-lg">⋯</span>
          </button>

          {open ? (
            <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-[#16151f]/95 shadow-2xl backdrop-blur">
              <div className="px-4 py-3">
                <div className="text-sm font-semibold text-white/90">{toolLabel(String(context || ""))}</div>
                <div className="mt-0.5 text-xs text-white/50">Safety-acties voor dit profiel.</div>
              </div>

              <div className="h-px bg-white/10" />
              {renderedItems}
              <div className="px-4 pb-4 pt-1 text-[11px] text-white/35">Rapporten komen zichtbaar in het adminpaneel.</div>
            </div>
          ) : null}
        </div>
      )}

      {reportOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => !busy && setReportOpen(false)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#16151f] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4">
              <div className="text-lg font-semibold text-white">Rapporteren</div>
              <div className="mt-1 text-sm text-white/60">Vertel kort waarom je dit profiel wil rapporteren.</div>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-4 px-5 py-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Reden</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {REPORT_REASONS.map((item) => {
                    const active = reportReason === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setReportReason(item.value)}
                        className={cls(
                          "rounded-2xl border px-3 py-3 text-left text-sm transition",
                          active
                            ? "border-rose-300/30 bg-rose-400/10 text-rose-100"
                            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Extra toelichting
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value.slice(0, 600))}
                  rows={4}
                  placeholder="Beschrijf kort wat er gebeurd is…"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <input
                  type="checkbox"
                  checked={blockImmediately}
                  onChange={(e) => setBlockImmediately(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent"
                />
                <div>
                  <div className="text-sm font-semibold text-white/85">Ook meteen blokkeren en verbergen</div>
                  <div className="mt-0.5 text-xs text-white/55">
                    Dit profiel verdwijnt meteen uit Discover en chat. Admins blijven het rapport wel zien.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  if (busy) return;
                  setReportOpen(false);
                }}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/5"
                disabled={Boolean(busy)}
              >
                Annuleren
              </button>

              <button
                type="button"
                onClick={handleReportSubmit}
                className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-400/15 disabled:opacity-60"
                disabled={busy === "report"}
              >
                {busy === "report" ? "Bezig..." : "Rapport verzenden"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
