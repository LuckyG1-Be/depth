"use client";

import { useMemo, useRef } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AgeRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}) {
  const range = max - min;

  const leftPct = useMemo(() => ((valueMin - min) / range) * 100, [valueMin, min, range]);
  const rightPct = useMemo(() => 100 - ((valueMax - min) / range) * 100, [valueMax, min, range]);

  const minRef = useRef<HTMLInputElement | null>(null);
  const maxRef = useRef<HTMLInputElement | null>(null);

  function setMin(v: number) {
    const nv = clamp(v, min, valueMax);
    onChangeMin(nv);
  }
  function setMax(v: number) {
    const nv = clamp(v, valueMin, max);
    onChangeMax(nv);
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold" style={{ color: "#66b96c" }}>
          Leeftijd
        </p>
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white/85">
          {valueMin} – {valueMax >= 65 ? "65+" : valueMax}
        </div>
      </div>

      <div className="mt-3 relative h-8">
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="h-2 w-full rounded-full bg-white/15" />
          <div
            className="absolute h-2 rounded-full"
            style={{ background: "rgba(102,185,108,0.70)", boxShadow: "0 0 18px rgba(102,185,108,0.35)", left: `${leftPct}%`, right: `${rightPct}%` }}
          />
        </div>

        <input
          ref={minRef}
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => setMin(Number(e.target.value))}
          className="absolute left-0 right-0 top-0 h-8 w-full appearance-none bg-transparent"
          style={{ pointerEvents: "auto" }}
        />

        <input
          ref={maxRef}
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => setMax(Number(e.target.value))}
          className="absolute left-0 right-0 top-0 h-8 w-full appearance-none bg-transparent"
          style={{ pointerEvents: "auto" }}
        />

        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 22px;
            width: 22px;
            border-radius: 999px;
            background: rgba(102, 185, 108, 1);
            border: 2px solid rgba(255, 255, 255, 0.75);
            box-shadow: 0 0 14px rgba(102, 185, 108, 0.55);
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            height: 22px;
            width: 22px;
            border-radius: 999px;
            background: rgba(102, 185, 108, 1);
            border: 2px solid rgba(255, 255, 255, 0.75);
            box-shadow: 0 0 14px rgba(102, 185, 108, 0.55);
            cursor: pointer;
          }
          input[type="range"]::-webkit-slider-runnable-track {
            background: transparent;
          }
          input[type="range"]::-moz-range-track {
            background: transparent;
          }
        `}</style>
      </div>
    </div>
  );
}
