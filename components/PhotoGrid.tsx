"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";

type PhotoRow = { id: string; slot: number };

type MeResponse = {
  ok: boolean;
  user: { id: string; name: string; city: string; birthdate: string | null };
  profile: any;
  photos: Array<{ id: string; slot: number }>;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const MAX_SLOTS = 6;

function SlotCard({
  slot,
  photo,
  onUpload,
  onDelete,
  onSwap,
}: {
  slot: number;
  photo: PhotoRow | null;
  onUpload: (slot: number, file: File) => void;
  onDelete: (photoId: string) => void;
  onSwap: (photoId: string, targetSlot: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const src = photo ? `/api/photo/${photo.id}` : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="aspect-[3/4] w-full">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid h-full w-full place-items-center text-white/60 hover:text-white transition"
            title={`Foto toevoegen (slot ${slot})`}
          >
            <div className="text-4xl">+</div>
          </button>
        )}
      </div>

      <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white/80 backdrop-blur">
        Foto {slot}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(slot, f);
          e.currentTarget.value = "";
        }}
      />

      {photo ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute left-3 bottom-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
            title="Vervangen"
          >
            ↻
          </button>

          <button
            type="button"
            onClick={() => onDelete(photo.id)}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
            title="Verwijderen"
          >
            ✕
          </button>

          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => slot > 1 && onSwap(photo.id, slot - 1)}
              disabled={slot <= 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 disabled:opacity-40"
              title="Naar links"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => slot < MAX_SLOTS && onSwap(photo.id, slot + 1)}
              disabled={slot >= MAX_SLOTS}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 disabled:opacity-40"
              title="Naar rechts"
            >
              →
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function PhotoGrid() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/profile/me", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as MeResponse | null;
    if (!data?.ok) return;
    setPhotos((data.photos || []).map((p) => ({ id: p.id, slot: p.slot })));
  }

  useEffect(() => {
    void refresh();
  }, []);

  const slots = useMemo(() => {
    const bySlot = new Map<number, PhotoRow>();
    for (const p of photos) bySlot.set(p.slot, p);
    return Array.from({ length: MAX_SLOTS }, (_, i) => {
      const slot = i + 1;
      return { slot, photo: bySlot.get(slot) || null };
    });
  }, [photos]);

  async function upload(slot: number, file: File) {
    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("slot", String(slot));
      fd.append("photo", file);

      const res = await fetch("/api/profile/photos/set", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok !== true) {
        toast({ kind: "error", title: "Upload mislukt", message: String(data?.error || "Probeer opnieuw") });
        return;
      }

      toast({ kind: "success", message: "Foto opgeslagen" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function del(photoId: string) {
    if (!confirm("Foto verwijderen?")) return;
    try {
      setBusy(true);
      const res = await fetch("/api/profile/photos/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok !== true) {
        toast({ kind: "error", title: "Verwijderen mislukt", message: String(data?.error || "Probeer opnieuw") });
        return;
      }
      toast({ kind: "success", message: "Foto verwijderd" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function swap(photoId: string, targetSlot: number) {
    try {
      setBusy(true);
      const res = await fetch("/api/profile/photos/swap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photoId, targetSlot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok !== true) {
        toast({ kind: "error", title: "Verplaatsen mislukt", message: String(data?.error || "Probeer opnieuw") });
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cls(busy && "pointer-events-none opacity-80")}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {slots.map(({ slot, photo }) => (
          <SlotCard key={slot} slot={slot} photo={photo} onUpload={upload} onDelete={del} onSwap={swap} />
        ))}
      </div>
      <div className="mt-3 text-xs text-white/60">
        Min. 4 foto’s om te kunnen swipen. Sleep/klik via pijltjes om de volgorde te bepalen.
      </div>
    </div>
  );
}