"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

function fmtDelta(n: number) {
  if (n === 0) return "0%";
  if (n > 0) return `+${n}%`;
  return `${n}%`;
}

type Props = {
  open: boolean;
  onClose: () => void;

  score: number;

  // Baseline "basis" score (so the rows sum up to the final score)
  baseline?: number;

  valuesHit: number;
  passionsHit: number;

  valuesPoints?: number;
  passionsPoints?: number;

  qaSimilarityPct?: number;
  qaPoints?: number;

  sameCity: boolean;
  cityBoost: number;
  distancePoints?: number;

  intentHit?: boolean;
  religionHit?: boolean;
  intentBoost?: number;
  religionBoost?: number;
  intentPenalty?: number;
  religionPenalty?: number;

  lifestylePoints?: number;
  activityPoints?: number;
  qualityPoints?: number;
  reasons?: string[];
};

export function MatchScoreWhy(props: Props) {
  const {
    open,
    onClose,
    score,
    baseline = 36,
    valuesHit,
    passionsHit,
    valuesPoints,
    passionsPoints,
    qaSimilarityPct,
    qaPoints,
    sameCity,
    cityBoost,
    distancePoints,
    intentHit,
    religionHit,
    intentBoost,
    religionBoost,
    intentPenalty,
    religionPenalty,
    lifestylePoints,
    activityPoints,
    qualityPoints,
    reasons = [],
  } = props;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const items = useMemo(() => {
    const out: { label: string; value: string; hint?: string; strong?: boolean }[] = [];

    // ✅ Basis terug zodat de som volledig klopt/leesbaar is
    out.push({
      label: "Basis",
      value: fmtDelta(baseline),
      hint: "Startpunt (voor overlap/filters)",
    });

    out.push({
      label: "Waarden",
      value: fmtDelta(valuesPoints ?? 0),
      hint: valuesHit ? `${valuesHit} gedeelde waarde${valuesHit === 1 ? "" : "n"}` : "Geen overlap",
    });

    out.push({
      label: "Passies",
      value: fmtDelta(passionsPoints ?? 0),
      hint: passionsHit ? `${passionsHit} gedeelde passie${passionsHit === 1 ? "" : "s"}` : "Geen overlap",
    });

    if (typeof qaPoints === "number" || typeof qaSimilarityPct === "number") {
      out.push({
        label: "Depth-antwoorden",
        value: fmtDelta(qaPoints ?? 0),
        hint: typeof qaSimilarityPct === "number" ? `Tekst-overeenkomst: ${qaSimilarityPct}%` : "Tekst-overeenkomst",
      });
    }

    out.push({
      label: sameCity ? "Afstand / stad" : "Afstand",
      value: fmtDelta(distancePoints ?? cityBoost ?? 0),
      hint: sameCity ? "Zelfde stad of heel dichtbij" : "Op basis van afstand tot je profiel",
    });

    if (typeof intentHit === "boolean") {
      if (intentHit) out.push({ label: "Intent match", value: fmtDelta(intentBoost ?? 0) });
      else if ((intentPenalty ?? 0) !== 0) out.push({ label: "Intent mismatch", value: fmtDelta(intentPenalty ?? 0) });
      else out.push({ label: "Intent", value: "0%" });
    }

    if (typeof religionHit === "boolean") {
      if (religionHit) out.push({ label: "Religie match", value: fmtDelta(religionBoost ?? 0) });
      else if ((religionPenalty ?? 0) !== 0) out.push({ label: "Religie mismatch", value: fmtDelta(religionPenalty ?? 0) });
      else out.push({ label: "Religie", value: "0%" });
    }

    if (typeof lifestylePoints === "number" && lifestylePoints > 0) {
      out.push({ label: "Levensstijl", value: fmtDelta(lifestylePoints), hint: "Roken, drinken en beweging" });
    }

    if (typeof activityPoints === "number" && activityPoints > 0) {
      out.push({ label: "Recent actief", value: fmtDelta(activityPoints), hint: "Helpt actieve profielen hoger te tonen" });
    }

    if (typeof qualityPoints === "number" && qualityPoints > 0) {
      out.push({ label: "Profielkwaliteit", value: fmtDelta(qualityPoints), hint: "Meer foto’s en rijkere antwoorden" });
    }

    // ✅ Totaal-rij zodat de lijst de volledige som “afsluit”
    out.push({
      label: "Totaal",
      value: `${score}%`,
      strong: true,
    });

    return out;
  }, [
    baseline,
    valuesHit,
    passionsHit,
    valuesPoints,
    passionsPoints,
    qaSimilarityPct,
    qaPoints,
    sameCity,
    cityBoost,
    distancePoints,
    intentHit,
    religionHit,
    intentBoost,
    religionBoost,
    intentPenalty,
    religionPenalty,
    lifestylePoints,
    activityPoints,
    qualityPoints,
    score,
  ]);

  const modal = useMemo(() => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-50">Waarom matchen?</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Score: <span className="font-semibold text-zinc-200">{score}%</span>
              </p>
            </div>

            <Button variant="ghost" onClick={onClose} className="shrink-0">
              Sluiten
            </Button>
          </div>

          {reasons.length > 0 ? (
            <div className="mt-5 rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-50/70">Belangrijkste redenen</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {reasons.map((reason) => (
                  <span key={reason} className="rounded-full border border-emerald-200/15 bg-black/20 px-3 py-1.5 text-xs text-emerald-50/90">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className={it.strong ? "text-sm font-semibold text-zinc-50" : "text-sm font-medium text-zinc-100"}>
                    {it.label}
                  </p>
                  {it.hint ? <p className="mt-0.5 text-xs text-zinc-400">{it.hint}</p> : null}
                </div>
                <p className={it.strong ? "text-sm font-semibold text-zinc-50" : "text-sm font-semibold text-zinc-100"}>
                  {it.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button onClick={onClose} className="w-full">
              Oké
            </Button>
          </div>
        </Card>
      </div>
    );
  }, [open, onClose, items, score]);

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
