"use client";

import React from "react";

export function MultiSelectChips({
  label,
  options,
  selected,
  max,
  onChange,
  helperText,
}: {
  label: string;
  options: string[];
  selected: string[];
  max: number;
  onChange: (next: string[]) => void;
  helperText?: string;
}) {
  function toggle(option: string) {
    const exists = selected.includes(option);

    if (exists) {
      onChange(selected.filter((x) => x !== option));
      return;
    }

    if (selected.length >= max) return;
    onChange([...selected, option]);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-100">
          {label} <span className="text-zinc-400 font-normal">({selected.length}/{max})</span>
        </div>
        {helperText && <div className="text-xs text-zinc-400">{helperText}</div>}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = selected.includes(opt);
          const isDisabled = !isActive && selected.length >= max;

          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              disabled={isDisabled}
              className={[
                "rounded-full px-4 py-2 text-sm transition border",
                isActive
                  ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                  : "bg-transparent text-zinc-100 border-zinc-700 hover:border-zinc-500",
                isDisabled ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

