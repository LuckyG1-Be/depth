// components/premium/DepthToolRunnerModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Sparkles, ArrowRight, Check } from "lucide-react";
import { buildFlowForTool, type ToolFlow, type ToolFlowStep } from "@/lib/premium/flows";

export type ToolSession = {
  id?: string;
  toolKey: string;
  toolTitle?: string;
  toolType?: string;
  cost: number;
  payload?: any;
  createdAt?: string;
  matchId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  session: ToolSession | null;
  otherName: string;
  onFinish: (resultText: string) => Promise<void> | void;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getCtxOtherName(session: ToolSession | null, fallback: string) {
  const fromPayload = session?.payload?.ctx?.otherName;
  if (typeof fromPayload === "string" && fromPayload.trim()) return fromPayload.trim();
  return String(fallback || "je match").trim() || "je match";
}

function renderTemplate(input: string, otherName: string) {
  return input
    .replaceAll("${ctx.otherName}", otherName)
    .replaceAll("${otherName}", otherName)
    .replaceAll("{otherName}", otherName);
}

export default function DepthToolRunnerModal({ open, onClose, session, otherName, onFinish }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const resolvedOtherName = useMemo(
    () => getCtxOtherName(session, otherName),
    [session, otherName]
  );

  const flow = useMemo<ToolFlow | null>(() => {
    if (!session?.toolKey) return null;
    return buildFlowForTool(session.toolKey, {
      otherName: resolvedOtherName,
      matchId: session.matchId ?? null,
      sessionId: session.id ?? null,
    });
  }, [session, resolvedOtherName]);

  const steps = flow?.steps ?? [];
  const safeStepIdx = steps.length > 0 ? Math.min(stepIdx, steps.length - 1) : 0;
  const step: ToolFlowStep | null = steps[safeStepIdx] ?? null;
  const hasValidStep = Boolean(flow && steps.length > 0 && step);

  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setAnswers({});
  }, [open, session?.id, session?.toolKey]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetAndClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!flow) return;
    if (steps.length === 0) {
      setStepIdx(0);
      return;
    }
    if (stepIdx > steps.length - 1) {
      setStepIdx(steps.length - 1);
    }
  }, [flow, steps.length, stepIdx]);

  function resetAndClose() {
    setStepIdx(0);
    setAnswers({});
    onClose();
  }

  function setAnswer(key: string, value: any) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function canNext() {
    if (!step) return false;

    if (step.kind === "pick") {
      if (step.multi) {
        return Array.isArray(answers[step.id]) && answers[step.id].length > 0;
      }
      return typeof answers[step.id] === "string" && answers[step.id].length > 0;
    }

    if (step.kind === "scale") {
      return typeof answers[step.id] === "number";
    }

    if (step.kind === "free") {
      return typeof answers[step.id] === "string" && String(answers[step.id]).trim().length > 0;
    }

    return false;
  }

  async function finish() {
    if (!flow) return;
  
    const lines: string[] = [];
    const a = answers;
  
    function val(id: string) {
      return a[id];
    }
  
    lines.push(`🧩 ${flow.title}`);
    lines.push("");
  
    // =========================
    // TEGENPOLEN DUEL
    // =========================
  
    if (flow.key === "TEGENPOLEN_DUEL") {
      lines.push(`Jouw instinctieve keuzes:`);
  
      for (const s of flow.steps) {
        if (a[s.id]) {
          lines.push(`• ${a[s.id]}`);
        }
      }
  
      lines.push("");
      lines.push(
        `Dit zegt vaak iets over je natuurlijke stijl in verbinding: hoe je omgaat met tempo, ruimte en emoties.`
      );
      lines.push(
        `Vergelijk dit nu met ${resolvedOtherName}. Waar zitten jullie reflexen dicht bij elkaar — en waar vullen ze elkaar misschien net aan?`
      );
    }
  
    // =========================
    // SCENARIO SPIEGEL
    // =========================
  
    else if (flow.key === "SCENARIO_SPIEGEL") {
      lines.push(`Jouw reacties op verschillende situaties:`);
  
      for (const s of flow.steps) {
        if (a[s.id]) {
          lines.push(`• ${a[s.id]}`);
        }
      }
  
      lines.push("");
      lines.push(
        `Reacties in kleine situaties zeggen vaak meer over iemand dan voorkeuren.`
      );
      lines.push(
        `Vergelijk met ${resolvedOtherName}: reageren jullie meestal op een gelijkaardige manier, of ligt jullie instinct ergens anders?`
      );
    }
  
    // =========================
    // VERHALEN IN 3 ZINNEN
    // =========================
  
    else if (flow.key === "VERHALEN_DRIE_ZINNEN") {
      lines.push(`Jouw mini-verhaal:`);
  
      if (val("scene")) lines.push(val("scene"));
      if (val("twist")) lines.push(val("twist"));
      if (val("ending")) lines.push(val("ending"));
  
      lines.push("");
  
      if (val("meaning")) {
        lines.push(`Wat jij er zelf over zegt:`);
        lines.push(val("meaning"));
        lines.push("");
      }
  
      lines.push(
        `Verhalen zeggen vaak iets over hoe iemand spontaan naar verbinding kijkt:`
      );
      lines.push(
        `romantisch, voorzichtig, speels of realistisch.`
      );
      lines.push(
        `Vergelijk eens met het verhaal van ${resolvedOtherName}.`
      );
    }
  
    // =========================
    // RELATIE KOMPAS
    // =========================
  
    else if (flow.key === "RELATIE_KOMPAS") {
      lines.push(`Jouw relatie-kompas:`);
  
      for (const s of flow.steps) {
        if (typeof a[s.id] === "number") {
          lines.push(`• ${s.prompt} → ${a[s.id]}`);
        }
      }
  
      lines.push("");
  
      if (val("reflection")) {
        lines.push(val("reflection"));
        lines.push("");
      }
  
      lines.push(
        `Deze sliders tonen waar jij ergens tussen twee polen zit.`
      );
      lines.push(
        `Het interessante gesprek begint wanneer jij en ${resolvedOtherName} zien waar jullie kompas anders wijst.`
      );
    }
  
    // =========================
    // FALLBACK
    // =========================
  
    else {
      for (const s of flow.steps) {
        if (a[s.id]) {
          lines.push(`${s.prompt}`);
          lines.push(`• ${a[s.id]}`);
          lines.push("");
        }
      }
    }
  
    const resultText = lines.join("\n").trim();
  
    await onFinish(resultText);
  
    setStepIdx(0);
    setAnswers({});
    onClose();
  }

  if (!open || !session) return null;
  if (!flow) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center bg-black/72 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) resetAndClose();
      }}
      onTouchStart={(event) => {
        if (event.target === event.currentTarget) resetAndClose();
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#14131c] shadow-2xl sm:rounded-[28px]"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <Sparkles className="h-4 w-4 text-emerald-200/90" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">{flow.title}</div>
              <div className="text-xs text-white/50">
                {flow.type === "scenario" ? "Scenario • samen" : "Mini-game • samen"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20 text-white/70 hover:bg-black/30"
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="grid gap-3 md:grid-cols-[1fr_320px] md:gap-4">
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            {!hasValidStep ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                Deze tool is nog niet volledig beschikbaar.
              </div>
            ) : (
              <>
                <div className="text-xs font-semibold text-white/60">
                  Stap {safeStepIdx + 1} / {steps.length}
                </div>

                <div className="mt-2 text-lg font-semibold text-white">
                  {renderTemplate(step.prompt, resolvedOtherName)}
                </div>

                {step.hint ? (
                  <div className="mt-1 text-sm text-white/55">
                    {renderTemplate(step.hint, resolvedOtherName)}
                  </div>
                ) : null}

                <div className="mt-4 space-y-2">
                  {step.kind === "pick" && (
                    <>
                      {step.options.map((opt: string) => {
                        const active = step.multi
                          ? Array.isArray(answers[step.id]) && answers[step.id].includes(opt)
                          : answers[step.id] === opt;

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              if (step.multi) {
                                const prev = Array.isArray(answers[step.id]) ? answers[step.id] : [];
                                const next = prev.includes(opt)
                                  ? prev.filter((x: string) => x !== opt)
                                  : [...prev, opt];
                                setAnswer(step.id, next);
                              } else {
                                setAnswer(step.id, opt);
                              }
                            }}
                            className={cls(
                              "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition",
                              active
                                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-50"
                                : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30"
                            )}
                          >
                            <span>{opt}</span>
                            {active ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </>
                  )}

                  {step.kind === "scale" && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-4 text-xs text-white/50">
                        <span>{step.minLabel}</span>
                        <span className="text-right">{step.maxLabel}</span>
                      </div>

                      <input
                        type="range"
                        min={step.min ?? 1}
                        max={step.max ?? 10}
                        step={1}
                        value={
                          typeof answers[step.id] === "number"
                            ? answers[step.id]
                            : Math.round(((step.min ?? 1) + (step.max ?? 10)) / 2)
                        }
                        onChange={(e) => setAnswer(step.id, Number(e.target.value))}
                        className="mt-3 w-full"
                      />

                      <div className="mt-2 text-center text-sm font-semibold text-white/80">
                        {typeof answers[step.id] === "number"
                          ? answers[step.id]
                          : Math.round(((step.min ?? 1) + (step.max ?? 10)) / 2)}
                      </div>
                    </div>
                  )}

                  {step.kind === "free" && (
                    <textarea
                      className="min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-300/30"
                      placeholder={step.placeholder || "Typ je antwoord…"}
                      value={typeof answers[step.id] === "string" ? answers[step.id] : ""}
                      onChange={(e) => setAnswer(step.id, e.target.value)}
                      rows={step.multiline ? 5 : 4}
                    />
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStepIdx((v) => Math.max(0, v - 1))}
                    disabled={safeStepIdx === 0}
                    className={cls(
                      "rounded-2xl border px-4 py-2 text-sm font-semibold",
                      safeStepIdx === 0
                        ? "border-white/10 bg-white/5 text-white/35"
                        : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30"
                    )}
                  >
                    Terug
                  </button>

                  {safeStepIdx < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setStepIdx((v) => Math.min(steps.length - 1, v + 1))}
                      disabled={!canNext()}
                      className={cls(
                        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold",
                        !canNext()
                          ? "bg-white/10 text-white/40"
                          : "bg-emerald-400 text-black hover:bg-emerald-300"
                      )}
                    >
                      Volgende <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finish}
                      disabled={!canNext()}
                      className={cls(
                        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold",
                        !canNext()
                          ? "bg-white/10 text-white/40"
                          : "bg-emerald-400 text-black hover:bg-emerald-300"
                      )}
                    >
                      Plaats in chat <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white/80">Tip</div>
            <div className="mt-2 text-sm leading-relaxed text-white/60">
              Dit is het leukst als jullie om de beurt antwoorden. Je hoeft niets te copy-pasten —
              na “Plaats in chat” sturen we het resultaat als één bericht in jullie gesprek.
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50/90">
              Match: <b className="text-emerald-50">{resolvedOtherName}</b>
              <div className="mt-1 text-xs text-emerald-50/65">Kosten: {session.cost} tokens</div>
            </div>

            {flow.intro ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-relaxed text-white/65">
                {renderTemplate(flow.intro, resolvedOtherName)}
              </div>
            ) : null}

            {flow.tip ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-relaxed text-white/55">
                {renderTemplate(flow.tip, resolvedOtherName)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
