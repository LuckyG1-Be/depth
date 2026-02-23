"use client";

import { useMemo, useState } from "react";

export type AdminVerificationRow = {
  id: string;
  createdAtISO: string;
  selfieCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    verified: boolean;
    photos: Array<{ id: string; slot: number | null }>;
  };
  selfies: Array<{ index: number; label: string }>;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminVerificationsClient({ rows }: { rows: AdminVerificationRow[] }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? rows[0], [rows, selectedId]);

  const [modal, setModal] = useState<null | { kind: "photo" | "selfie"; src: string; title: string }>(null);

  if (!selected) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* LEFT: queue */}
      <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Queue</div>
          <div className="text-xs text-white/60">{rows.length} pending</div>
        </div>

        <div className="space-y-2">
          {rows.map((r) => {
            const active = r.id === selectedId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={cls(
                  "w-full rounded-2xl border p-3 text-left transition",
                  active ? "border-emerald-300/30 bg-emerald-400/10" : "border-white/10 bg-black/20 hover:bg-white/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white/90 truncate">{r.user.name}</div>
                  <div className={cls("rounded-full border px-2 py-0.5 text-[11px] font-semibold", "border-sky-300/25 bg-sky-400/10 text-sky-50")}>
                    {r.selfieCount} selfies
                  </div>
                </div>
                <div className="mt-1 text-xs text-white/60 truncate">{r.user.email}</div>
                <div className="mt-2 text-[11px] text-white/45">{fmtDate(r.createdAtISO)}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* RIGHT: detail */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-lg font-semibold text-white">{selected.user.name}</div>
              {selected.user.verified && (
                <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-50">
                  Verified
                </div>
              )}
            </div>
            <div className="text-sm text-white/70">{selected.user.email}</div>
            <div className="mt-1 text-xs text-white/50">{fmtDate(selected.createdAtISO)}</div>
          </div>

          <div className="flex gap-2">
            <form action={`/api/admin/verifications/${selected.id}`} method="post">
              <input type="hidden" name="action" value="APPROVE" />
              <button className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-5 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-400/15">
                Approve
              </button>
            </form>

            <form action={`/api/admin/verifications/${selected.id}`} method="post">
              <input type="hidden" name="action" value="REJECT" />
              <button className="rounded-2xl border border-red-300/30 bg-red-400/10 px-5 py-2 text-sm font-semibold text-red-50 hover:bg-red-400/15">
                Reject
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* Profile photos */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">Profielfoto’s</div>
              <div className="text-xs text-white/60">klik om te vergroten</div>
            </div>

            {selected.user.photos.length === 0 ? (
              <div className="mt-3 text-sm text-white/60">Geen profielfoto’s.</div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {selected.user.photos.map((p) => {
                  const src = `/api/photo/${p.id}`;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setModal({ kind: "photo", src, title: `Profielfoto (slot ${p.slot ?? "?"})` })}
                      className="overflow-hidden rounded-xl border border-white/10 bg-black/30 text-left hover:border-white/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`photo ${p.slot ?? ""}`} className="h-40 w-full object-cover" />
                      <div className="px-2 py-1 text-xs text-white/60">Slot {p.slot ?? "?"}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selfies */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">Selfies (poses)</div>
              <div className="text-xs text-white/60">klik om te vergroten</div>
            </div>

            {selected.selfies.length === 0 ? (
              <div className="mt-3 text-sm text-white/60">Geen selfies gevonden.</div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {selected.selfies.map((s) => {
                  const src = `/api/admin/verifications/${selected.id}/image?i=${s.index}`;
                  return (
                    <button
                      key={`${selected.id}-${s.index}`}
                      type="button"
                      onClick={() => setModal({ kind: "selfie", src, title: s.label })}
                      className="overflow-hidden rounded-xl border border-white/10 bg-black/30 text-left hover:border-white/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`selfie ${s.index + 1}`} className="h-40 w-full object-cover" />
                      <div className="px-2 py-1 text-xs text-white/70">{s.label}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Tip: open een selfie en een profielfoto om snel te vergelijken. (We tonen alles via je bestaande protected endpoints.)
        </div>
      </section>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setModal(null)}>
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#12101a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="text-sm font-semibold text-white/90">{modal.title}</div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Sluiten
              </button>
            </div>

            <div className="p-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={modal.src} alt={modal.title} className="w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}