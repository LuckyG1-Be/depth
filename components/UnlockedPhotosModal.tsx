"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export function UnlockedPhotosModal({
  photoIds,
  open,
  onClose,
}: {
  photoIds: string[];
  open: boolean;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);

  const ids = useMemo(() => photoIds.filter(Boolean), [photoIds]);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(ids.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, ids.length, onClose]);

  if (!open) return null;

  const current = ids[idx];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-300">
              Foto {ids.length ? idx + 1 : 0}/{ids.length}
            </div>
            <button
              className="rounded-xl border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
              onClick={onClose}
            >
              Sluiten
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current ? `/api/photo/${current}` : ""}
              alt="photo"
              className="h-[60vh] w-full object-contain"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Button variant="secondary" disabled={idx <= 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
              Vorige
            </Button>
            <Button
              variant="secondary"
              disabled={idx >= ids.length - 1}
              onClick={() => setIdx((i) => Math.min(ids.length - 1, i + 1))}
            >
              Volgende
            </Button>
          </div>

          {ids.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {ids.map((id, i) => (
                <button
                  key={id}
                  onClick={() => setIdx(i)}
                  className={
                    "h-16 w-16 shrink-0 overflow-hidden rounded-xl border " +
                    (i === idx ? "border-white" : "border-zinc-800")
                  }
                  title={`Foto ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/photo/${id}?thumb=1`} alt="thumb" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
