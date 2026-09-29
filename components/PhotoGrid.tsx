"use client";

import { useMemo, useRef, useState } from "react";

export type ProfilePhoto = {
  id: string;
  slot: number; // 0..8
  url: string;
};

const MAX_SLOTS = 9;
const MIN_REQUIRED = 4;

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || "Actie mislukt");
  return data;
}

async function postForm(url: string, fd: FormData) {
  const res = await fetch(url, { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || "Upload mislukt");
  return data;
}

function Icon({ name }: { name: "plus" | "delete" | "crown" | "left" | "right" | "loader" }) {
  if (name === "loader")
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin">
        <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );

  const paths: Record<string, string> = {
    plus: "M12 5v14M5 12h14",
    delete: "M18 6L6 18M6 6l12 12",
    crown: "M5 16l2-8 5 4 5-4 2 8H5Zm1 4h12",
    left: "M14 6l-6 6 6 6",
    right: "M10 6l6 6-6 6",
  };

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProfilePhotoManager({
  photos,
  onRefresh,
}: {
  photos: ProfilePhoto[];
  onRefresh: () => Promise<void>;
}) {
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [busyGlobal, setBusyGlobal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ✅ We keep refs only for EMPTY slots (no replace)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const bySlot = useMemo(() => {
    const m = new Map<number, ProfilePhoto>();
    for (const p of photos) m.set(p.slot, p);
    return m;
  }, [photos]);

  const filledCount = photos.length;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1300);
  }

  function openPicker(slot: number) {
    inputRefs.current[slot]?.click();
  }

  async function upload(slot: number, file: File) {
    // ✅ Hard rule: no replace
    if (bySlot.get(slot)) {
      setError("Dit slot is al gevuld. Verwijder eerst de foto om een nieuwe toe te voegen.");
      return;
    }

    setError(null);
    setBusySlot(slot);
    try {
      const fd = new FormData();
      fd.set("slot", String(slot)); // 0-based
      fd.set("photo", file);
      await postForm("/api/profile/photos/set", fd);
      await onRefresh();
      showToast("Foto toegevoegd");
    } catch (e: any) {
      setError(e?.message || "Upload mislukt");
    } finally {
      setBusySlot(null);
      if (inputRefs.current[slot]) inputRefs.current[slot]!.value = "";
    }
  }

  async function remove(photoId: string) {
    setError(null);
    setBusyGlobal(true);
    try {
      await postJson("/api/profile/photos/delete", { photoId });
      await onRefresh();
      showToast("Foto verwijderd");
    } catch (e: any) {
      setError(e?.message || "Verwijderen mislukt");
    } finally {
      setBusyGlobal(false);
    }
  }

  async function move(from: number, to: number) {
    if (from === to) return;
    if (to < 0 || to >= MAX_SLOTS) return;
    setError(null);
    setBusyGlobal(true);
    try {
      await postJson("/api/profile/photos/move", { from, to });
      await onRefresh();
      showToast("Volgorde aangepast");
    } catch (e: any) {
      setError(e?.message || "Actie mislukt");
    } finally {
      setBusyGlobal(false);
    }
  }

  return (
    <section className="relative rounded-3xl border border-white/10 bg-white/5 p-6">
      {toast && (
        <div className="pointer-events-none absolute right-5 top-5 rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-xs text-white/90 backdrop-blur">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Foto’s</h2>
          <p className="mt-1 text-sm opacity-80">
            Min. <b>{MIN_REQUIRED}</b> nodig • Max <b>{MAX_SLOTS}</b> • <b>Vervangen kan niet</b> (eerst verwijderen)
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold">
          {filledCount}/{MAX_SLOTS}
        </div>
      </div>

      {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm">{error}</div>}

      <div className="mt-5 grid grid-cols-3 gap-3">
        {Array.from({ length: MAX_SLOTS }).map((_, slot) => {
          const p = bySlot.get(slot) || null;
          const busy = busyGlobal || busySlot === slot;
          const isMain = slot === 0;

          return (
            <div
              key={slot}
              className={cls(
                "group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20",
                isMain && p && "ring-1 ring-emerald-300/30"
              )}
              // ✅ Definitief: enkel click-to-add op lege slot
              onClick={() => {
                if (busy) return;
                if (!p) openPicker(slot);
              }}
              role={!p ? "button" : undefined}
              tabIndex={!p ? 0 : -1}
              title={!p ? "Klik om toe te voegen" : "Foto (vervangen uitgeschakeld)"}
            >
              {/* ✅ input bestaat ENKEL bij lege slot */}
              {!p && (
                <input
                  ref={(el) => {
                    inputRefs.current[slot] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(slot, f);
                  }}
                />
              )}

              <div className="aspect-[3/4] w-full">
                {p ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt={`photo-${slot}`}
                    className="h-full w-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openPicker(slot);
                      }}
                      disabled={busy}
                      className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 text-white/90 hover:bg-white/10 disabled:opacity-60"
                      aria-label="Voeg foto toe"
                      title="Voeg foto toe"
                    >
                      {busySlot === slot ? <Icon name="loader" /> : <Icon name="plus" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute left-2 top-2 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] text-white/80 backdrop-blur">
                {isMain ? "Hoofdfoto" : `#${slot + 1}`}
              </div>

              {p ? (
                <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void remove(p.id);
                      }}
                      disabled={busy}
                      className="rounded-xl border border-white/10 bg-black/45 p-2 text-white/90 hover:bg-black/60 disabled:opacity-60"
                      aria-label="Verwijder"
                      title="Verwijder"
                    >
                      <Icon name="delete" />
                    </button>

                    {!isMain && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void move(slot, 0);
                        }}
                        disabled={busy}
                        className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-2 text-emerald-100 hover:bg-emerald-400/15 disabled:opacity-60"
                        aria-label="Zet als hoofdfoto"
                        title="Zet als hoofdfoto"
                      >
                        <Icon name="crown" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void move(slot, slot - 1);
                      }}
                      disabled={busy || slot === 0}
                      className="rounded-xl border border-white/10 bg-black/45 p-2 text-white/90 hover:bg-black/60 disabled:opacity-60"
                      aria-label="Links"
                      title="Links"
                    >
                      <Icon name="left" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void move(slot, slot + 1);
                      }}
                      disabled={busy || slot === MAX_SLOTS - 1}
                      className="rounded-xl border border-white/10 bg-black/45 p-2 text-white/90 hover:bg-black/60 disabled:opacity-60"
                      aria-label="Rechts"
                      title="Rechts"
                    >
                      <Icon name="right" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
