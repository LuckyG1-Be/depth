"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  name: string;
  photoIds: string[];
};

export default function UnlockedPhotosModalClient({ name, photoIds }: Props) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  const ids = useMemo(() => (photoIds ?? []).filter(Boolean), [photoIds]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") setIdx((v) => Math.max(0, v - 1));
      if (e.key === "ArrowRight") setIdx((v) => Math.min(ids.length - 1, v + 1));
    };

    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, ids.length]);

  useEffect(() => {
    if (idx > ids.length - 1) setIdx(0);
  }, [idx, ids.length]);

  if (!ids.length) return null;

  const currentId = ids[idx];

  const modal = open ? (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/80 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="text-sm font-semibold text-zinc-50">
            Foto’s van {name} <span className="text-zinc-400">({idx + 1}/{ids.length})</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Sluiten
          </button>
        </div>

        <div className="p-4">
          <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black">
            <div className="aspect-[3/4] max-h-[72vh] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentId ? `/api/photo/${currentId}` : ""}
                alt={`${name} foto ${idx + 1}`}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIdx((v) => Math.max(0, v - 1))}
              disabled={idx === 0}
              className="rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-200 disabled:opacity-40 hover:bg-zinc-900"
            >
              Vorige
            </button>

            <button
              type="button"
              onClick={() => setIdx((v) => Math.min(ids.length - 1, v + 1))}
              disabled={idx === ids.length - 1}
              className="rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-200 disabled:opacity-40 hover:bg-zinc-900"
            >
              Volgende
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {ids.map((id, i) => (
              <button
                key={id}
                type="button"
                onClick={() => setIdx(i)}
                className={
                  "relative shrink-0 overflow-hidden rounded-xl border " +
                  (i === idx ? "border-white" : "border-zinc-800 hover:border-zinc-600")
                }
                style={{ width: 56, height: 72 }}
                aria-label={`Kies foto ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/photo/${id}?thumb=1`} alt="thumb" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-zinc-500">Tip: ← → en Escape werken ook.</p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {ids.slice(0, 4).map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setIdx(i);
                setOpen(true);
              }}
              className="relative shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 hover:opacity-95"
              style={{ width: 84, height: 112 }}
              aria-label="Open foto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/photo/${id}?thumb=1`} alt={`${name} foto`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setIdx(0);
            setOpen(true);
          }}
          className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
        >
          Bekijk foto’s ({ids.length})
        </button>
      </div>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
