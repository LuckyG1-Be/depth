"use client";

import { useMemo, useRef, useState } from "react";

export type ProfilePhoto = {
  id: string;
  slot: number; // 0..8
  url: string;
};

const MAX_SLOTS = 9;
const MIN_REQUIRED = 4;
const MAX_FILE_SIZE_MB = 8;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function friendlyUploadError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("size") || lower.includes("groot") || lower.includes("large")) return `Bestand te groot. Gebruik een foto onder ${MAX_FILE_SIZE_MB} MB.`;
  if (lower.includes("type") || lower.includes("mime") || lower.includes("jpeg") || lower.includes("png") || lower.includes("webp")) return "Gebruik een JPG, PNG of WEBP foto.";
  if (lower.includes("blob") || lower.includes("storage") || lower.includes("upload")) return "Opslagfout. Probeer opnieuw of meld dit via feedback.";
  return message || "Upload mislukt. Probeer opnieuw.";
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

async function postForm(url: string, fd: FormData, onProgress?: (label: string) => void) {
  onProgress?.("Uploaden…");
  const res = await fetch(url, { method: "POST", body: fd });
  onProgress?.("Verwerken…");
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
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const bySlot = useMemo(() => {
    const m = new Map<number, ProfilePhoto>();
    for (const p of photos) m.set(p.slot, p);
    return m;
  }, [photos]);

  const filledCount = photos.length;
  const ready = filledCount >= MIN_REQUIRED;
  const nextEmptySlot = Array.from({ length: MAX_SLOTS }).findIndex((_, slot) => !bySlot.get(slot));

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1500);
  }

  function openPicker(slot: number) {
    inputRefs.current[slot]?.click();
  }

  async function upload(slot: number, file: File) {
    if (bySlot.get(slot)) {
      setError("Dit slot is al gevuld. Verwijder eerst de foto om een nieuwe toe te voegen.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`Bestand te groot. Gebruik een foto onder ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError("Gebruik een JPG, PNG of WEBP foto.");
      return;
    }

    setError(null);
    setProgressLabel("Upload voorbereiden…");
    setBusySlot(slot);

    try {
      const fd = new FormData();
      fd.set("slot", String(slot));
      fd.set("photo", file);

      await postForm("/api/profile/photos/set", fd, setProgressLabel);
      setProgressLabel("Foto ophalen…");
      await onRefresh();
      showToast("Foto toegevoegd");
    } catch (e: any) {
      setError(friendlyUploadError(e?.message || "Upload mislukt"));
    } finally {
      setBusySlot(null);
      setProgressLabel(null);
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
    <section className="relative rounded-3xl border border-white/10 bg-black/15 p-3 sm:p-5">
      {toast && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-2xl border border-white/10 bg-black/70 px-4 py-2 text-xs text-white/90 backdrop-blur">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Foto-overzicht</div>
          <p className="mt-1 text-xs text-white/55">Vervangen kan niet: verwijder eerst een foto.</p>
        </div>

        <div className={cls("rounded-xl border px-3 py-2 text-sm font-semibold", ready ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-50" : "border-white/10 bg-black/20 text-white/75")}>
          {filledCount}/{MAX_SLOTS} · {ready ? "voldoende" : `nog ${MIN_REQUIRED - filledCount}`}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${Math.min(100, (filledCount / MIN_REQUIRED) * 100)}%` }} />
      </div>

      {progressLabel ? <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-xs text-emerald-50">{progressLabel}</div> : null}
      {error ? <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">{error}</div> : null}

      {nextEmptySlot >= 0 ? (
        <button
          type="button"
          onClick={() => openPicker(nextEmptySlot)}
          disabled={busyGlobal || busySlot !== null}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/15 disabled:opacity-60 sm:hidden"
        >
          <Icon name={busySlot !== null ? "loader" : "plus"} />
          Foto toevoegen
        </button>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: MAX_SLOTS }).map((_, slot) => {
          const p = bySlot.get(slot) || null;
          const busy = busyGlobal || busySlot === slot;
          const isMain = slot === 0;

          return (
            <div
              key={slot}
              className={cls(
                "group relative overflow-hidden rounded-2xl border bg-black/20",
                isMain ? "border-emerald-300/25" : "border-white/10",
                !p && "cursor-pointer hover:border-white/20"
              )}
              onClick={() => {
                if (busy) return;
                if (!p) openPicker(slot);
              }}
              role={!p ? "button" : undefined}
              tabIndex={!p ? 0 : -1}
              title={!p ? "Klik om toe te voegen" : "Foto (vervangen uitgeschakeld)"}
            >
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
                  <img src={p.url} alt={`photo-${slot}`} className="pointer-events-none h-full w-full select-none object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/60">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      {busySlot === slot ? <Icon name="loader" /> : <Icon name="plus" />}
                    </div>
                    <div className="text-xs">Toevoegen</div>
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute left-2 top-2 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[10px] font-semibold text-white/85 backdrop-blur">
                {isMain ? "Hoofdfoto" : `Foto ${slot + 1}`}
              </div>

              {p ? (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 to-transparent p-2 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void remove(p.id);
                      }}
                      disabled={busy}
                      className="rounded-xl border border-white/10 bg-black/55 p-2 text-white/90 hover:bg-black/70 disabled:opacity-60"
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

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void move(slot, slot - 1);
                      }}
                      disabled={busy || slot === 0}
                      className="rounded-xl border border-white/10 bg-black/55 p-2 text-white/90 hover:bg-black/70 disabled:opacity-40"
                      aria-label="Naar links"
                      title="Naar links"
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
                      className="rounded-xl border border-white/10 bg-black/55 p-2 text-white/90 hover:bg-black/70 disabled:opacity-40"
                      aria-label="Naar rechts"
                      title="Naar rechts"
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
