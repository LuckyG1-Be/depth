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
  baseScore: number;
  valuesHit: number;
  passionsHit: number;
  sameCity: boolean;
  cityBoost: number;

  intentHit?: boolean;
  religionHit?: boolean;
  intentBoost?: number;
  religionBoost?: number;
  intentPenalty?: number;
  religionPenalty?: number;
};

export function MatchScoreWhy(props: Props) {
  const {
    open,
    onClose,
    score,
    baseScore,
    valuesHit,
    passionsHit,
    sameCity,
    cityBoost,
    intentHit,
    religionHit,
    intentBoost,
    religionBoost,
    intentPenalty,
    religionPenalty,
  } = props;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ESC close + body scroll lock
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
    const out: { label: string; value: string; hint?: string }[] = [];

    out.push({ label: "Basis", value: fmtDelta(baseScore) });

    out.push({
      label: "Values overlap",
      value: `+${valuesHit} × 6%`,
      hint: "Gedeelde waarden",
    });

    out.push({
      label: "Passions overlap",
      value: `+${passionsHit} × 4%`,
      hint: "Gedeelde interesses",
    });

    if (sameCity) {
      out.push({ label: "Zelfde stad", value: fmtDelta(cityBoost) });
    } else {
      out.push({ label: "Andere stad", value: "0%" });
    }

    if (typeof intentHit === "boolean") {
      if (intentHit) {
        out.push({ label: "Intent match", value: fmtDelta(intentBoost ?? 0) });
      } else if ((intentPenalty ?? 0) !== 0) {
        out.push({ label: "Intent mismatch", value: fmtDelta(intentPenalty ?? 0) });
      } else {
        out.push({ label: "Intent", value: "0%" });
      }
    }

    if (typeof religionHit === "boolean") {
      if (religionHit) {
        out.push({ label: "Religie match", value: fmtDelta(religionBoost ?? 0) });
      } else if ((religionPenalty ?? 0) !== 0) {
        out.push({ label: "Religie mismatch", value: fmtDelta(religionPenalty ?? 0) });
      } else {
        out.push({ label: "Religie", value: "0%" });
      }
    }

    return out;
  }, [
    baseScore,
    valuesHit,
    passionsHit,
    sameCity,
    cityBoost,
    intentHit,
    religionHit,
    intentBoost,
    religionBoost,
    intentPenalty,
    religionPenalty,
  ]);

  const modal = useMemo(() => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-50">Waarom deze match?</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Score: <span className="font-semibold text-zinc-200">{score}%</span>
              </p>
            </div>

            <Button variant="ghost" onClick={onClose} className="shrink-0">
              Sluiten
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100">{it.label}</p>
                  {it.hint ? <p className="mt-0.5 text-xs text-zinc-400">{it.hint}</p> : null}
                </div>
                <p className="text-sm font-semibold text-zinc-100">{it.value}</p>
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