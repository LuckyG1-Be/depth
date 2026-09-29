"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Sparkles, Search, Compass, Brain, BookOpen, MessageCircle, Wallet } from "lucide-react";
import { DEPTH_TOOLS_CATALOG } from "@/lib/premium/depthToolsCatalog";
import { TOOL_COSTS } from "@/lib/wallet/costs";
import { useToast } from "@/components/ToastProvider";
import { usePremium } from "@/components/premium/PremiumProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  matchId: string;
  onStart: (toolKey: string) => Promise<void> | void;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function toolIcon(key: string) {
  if (key === "TEGENPOLEN_DUEL") return Brain;
  if (key === "SCENARIO_SPIEGEL") return MessageCircle;
  if (key === "VERHALEN_DRIE_ZINNEN") return BookOpen;
  if (key === "RELATIE_KOMPAS") return Compass;
  return Sparkles;
}

function toolAccent(key: string) {
  if (key === "RELATIE_KOMPAS") return "border-white/10 bg-white/[0.04]";
  if (key === "VERHALEN_DRIE_ZINNEN") return "border-white/15 bg-white/[0.06]";
  if (key === "SCENARIO_SPIEGEL") return "border-white/10 bg-white/[0.04]";
  return "border-white/10 bg-white/[0.03]";
}

function tokenLabel(count: number) {
  return `${count} token${count === 1 ? "" : "s"}`;
}

export default function DepthToolsModal({ open, onClose, matchId, onStart }: Props) {
  void matchId;
  const { toast } = useToast();
  const { balance, freeRemaining: premiumFreeRemaining, refresh } = usePremium();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const paidBalance = balance ?? 0;
  const freeRemaining = premiumFreeRemaining ?? 0;
  const availableTotal = paidBalance + freeRemaining;
  const balanceKnown = balance !== null || premiumFreeRemaining !== null;

  useEffect(() => {
    if (!open) return;
    setQ("");
    setBusy(null);
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const items = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    const tools = DEPTH_TOOLS_CATALOG.filter((t) => t.active !== false);

    if (!query) return tools;

    return tools.filter((t) => {
      const hay = `${t.title} ${t.subtitle} ${t.description}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q]);

  async function startTool(toolKey: string, cost: number) {
    if (balanceKnown && availableTotal < cost) {
      toast({
        kind: "error",
        title: "Onvoldoende tokens",
        message: "Open je Wallet om tokens te kopen of kies een goedkoper Depth-moment.",
      });
      return;
    }

    setBusy(toolKey);
    try {
      await onStart(toolKey);
      void refresh();
    } catch (e: any) {
      toast({ kind: "error", title: "Depth-tool", message: e?.message || "Tool starten mislukt" });
    } finally {
      setBusy(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[240] flex items-end justify-center bg-black/72 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="depth-tools-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#14131c] shadow-2xl sm:rounded-[30px]"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <Sparkles className="h-4 w-4 text-emerald-200/90" />
            </div>

            <div className="min-w-0">
              <div id="depth-tools-title" className="truncate text-base font-semibold text-white">Depth-tools</div>
              <div className="truncate text-xs text-white/50">Start een interactief moment in jullie chat</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/24 text-white/76 transition hover:bg-black/34 active:scale-95"
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="grid gap-3 md:grid-cols-[1fr_320px] md:gap-4">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-3 sm:p-4">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Zoek tool..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div className="mt-3 space-y-2.5 pr-0 sm:mt-4 sm:space-y-3">
                {items.map((t) => {
                  const Icon = toolIcon(t.key);
                  const accent = toolAccent(t.key);
                  const cost = TOOL_COSTS[t.key] ?? t.cost ?? 2;
                  const insufficient = balanceKnown && availableTotal < cost;

                  return (
                    <div
                      key={t.key}
                      className={cls(
                        "group rounded-2xl border p-3 transition-all duration-200 sm:p-4",
                        accent,
                        "hover:-translate-y-[1px] hover:shadow-lg hover:shadow-black/40"
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/30">
                            <Icon className="h-4 w-4 text-white/80" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-white/90">{t.title}</div>
                              {t.badge ? (
                                <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/55">
                                  {t.badge}
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-1 text-xs text-white/50">{t.subtitle}</div>
                            <div className="mt-2 max-w-[420px] text-[12px] leading-relaxed text-white/42">{t.description}</div>
                            {insufficient ? <div className="mt-2 text-[11px] text-red-100/80">Je hebt nog {tokenLabel(Math.max(0, cost - availableTotal))} extra nodig.</div> : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end">
                          <div className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-white/60">
                            {tokenLabel(cost)}
                          </div>

                          <button
                            type="button"
                            onClick={() => startTool(t.key, cost)}
                            disabled={busy === t.key || insufficient}
                            className={cls(
                              "rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-95",
                              busy === t.key || insufficient
                                ? "bg-white/10 text-white/40"
                                : "bg-emerald-400 text-black hover:bg-emerald-300"
                            )}
                          >
                            {busy === t.key ? "Starten..." : insufficient ? "Te weinig" : "Start"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">Geen tools gevonden.</div>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-3 sm:p-4">
              <div className="text-sm font-semibold text-white/80">Je saldo</div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10">
                    <Wallet className="h-4 w-4 text-emerald-50/90" />
                  </span>
                  <div>
                    <div className="text-2xl font-semibold text-white">{balanceKnown ? availableTotal : "—"}</div>
                    <div className="text-xs text-white/50">beschikbare tokens</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-white/42">Betaald</div>
                    <div className="mt-1 font-semibold text-white/80">{paidBalance}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-white/42">Gratis</div>
                    <div className="mt-1 font-semibold text-white/80">{freeRemaining}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm font-semibold text-white/80">Hoe werkt dit?</div>
              <div className="mt-2 text-sm leading-relaxed text-white/60">
                Kies een tool en klik op <b className="text-white/80">Start</b>. Jullie doorlopen daarna een korte flow in-app.
              </div>

              <div className="mt-3 text-sm leading-relaxed text-white/60">
                Na <b className="text-white/80">Klaar</b> plaatsen we het resultaat als chatbericht.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
