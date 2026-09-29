"use client";

import { useEffect, useState } from "react";

export default function PhotoModal({ open, onClose, src }: { open: boolean; onClose: () => void; src: string }) {
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(true), [src]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6" onClick={onClose}>
      <div className="max-h-[85vh] max-w-[90vw] overflow-hidden rounded-3xl border border-white/10 bg-black/40">
        {ok ? (
          <img
            src={src}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={() => setOk(false)}
          />
        ) : (
          <div className="grid h-[60vh] w-[70vw] place-items-center p-6 text-sm text-white/70">Afbeelding kon niet geladen worden.</div>
        )}
      </div>
    </div>
  );
}
