"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  className?: string;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function AgeRangeSlider({ min, max, valueMin, valueMax, onChange, className }: Props) {
  const [minVal, setMinVal] = useState(() => clamp(valueMin, min, max));
  const [maxVal, setMaxVal] = useState(() => clamp(valueMax, min, max));

  useEffect(() => setMinVal(clamp(valueMin, min, max)), [valueMin, min, max]);
  useEffect(() => setMaxVal(clamp(valueMax, min, max)), [valueMax, min, max]);

  useEffect(() => {
    const a = clamp(Math.min(minVal, maxVal - 1), min, max);
    const b = clamp(Math.max(maxVal, a + 1), min, max);
    if (a !== minVal) setMinVal(a);
    if (b !== maxVal) setMaxVal(b);
    onChange(a, b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal]);

  const leftPct = useMemo(() => ((minVal - min) / (max - min)) * 100, [minVal, min, max]);
  const rightPct = useMemo(() => 100 - ((maxVal - min) / (max - min)) * 100, [maxVal, min, max]);

  return (
    <div className={className ?? ""}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-300">Leeftijdsrange</p>
        <p className="text-sm font-semibold text-emerald-300">
          {minVal} – {maxVal}
        </p>
      </div>

      <div className="mt-3">
        <div className="relative h-2 rounded-full bg-white/10">
          <div
            className="absolute h-2 rounded-full bg-emerald-500/70 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
            style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
          />
        </div>

        <div className="relative mt-3 h-6">
          <input
            type="range"
            min={min}
            max={max}
            value={minVal}
            onChange={(e) => setMinVal(Math.min(Number(e.target.value), maxVal - 1))}
            className="pointer-events-auto absolute inset-0 w-full appearance-none bg-transparent"
          />
          <input
            type="range"
            min={min}
            max={max}
            value={maxVal}
            onChange={(e) => setMaxVal(Math.max(Number(e.target.value), minVal + 1))}
            className="pointer-events-auto absolute inset-0 w-full appearance-none bg-transparent"
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 1);
          border: 2px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.55);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 1);
          border: 2px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.55);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}