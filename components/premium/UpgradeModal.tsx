// components/premium/UpgradeModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/ToastProvider";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Pack = {
  key: string;
  title: string;
  subtitle: string;
  tokens: number;
  amountCents: number;
  currency: "EUR";
  priceLabel: string;
  highlight?: boolean;
};

type LimitsResp = {
  ok: boolean;
  packs?: Pack[];
};

type StartResp = {
  ok: boolean;
  purchaseId?: string;
  checkoutUrl?: string;
  error?: string;
};

async function readJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function randomIdemKey(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

export default function UpgradeModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason: string | null;
}) {
  const { toast } = useToast();
  const [buying, setBuying] = useState<string | null>(null);

  const [packs, setPacks] = useState<Pack[]>([]);
  const [packsLoading, setPacksLoading] = useState(false);

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    let alive = true;

    async function loadPacks() {
      setPacksLoading(true);
      try {
        const res = await fetch("/api/wallet/limits", { cache: "no-store" }).catch(() => null);
        const j = res ? await readJsonSafe<LimitsResp>(res) : null;
        if (!alive) return;

        if (j?.ok && Array.isArray(j.packs) && j.packs.length) setPacks(j.packs);
      } finally {
        if (alive) setPacksLoading(false);
      }
    }

    void loadPacks();

    return () => {
      alive = false;
    };
  }, [open]);

  const fallbackPacks = useMemo<Pack[]>(
    () => [
      { key: "STARTER", title: "Starter", subtitle: "Voor af en toe een Depth-moment.", tokens: 8, amountCents: 900, currency: "EUR", priceLabel: "€ 9" },
      { key: "EXPLORER", title: "Explorer", subtitle: "De sweet spot voor actief chatten.", tokens: 20, amountCents: 1799, currency: "EUR", priceLabel: "€ 17,99", highlight: true },
      { key: "INTENT", title: "Intent", subtitle: "Voor een maand vol diepgang.", tokens: 50, amountCents: 3999, currency: "EUR", priceLabel: "€ 39,99" },
    ],
    []
  );

  const list = packs.length ? packs : fallbackPacks;

  if (!open) return null;

  async function startPurchase(packKey: string) {
    if (buying) return;
    setBuying(packKey);

    try {
      const idemKey = randomIdemKey(`purchase_${packKey}`);
      const res = await fetch("/api/wallet/purchase/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packKey, idemKey }),
      });

      const data = (await readJsonSafe(res)) as StartResp | null;

      if (!res.ok || !data?.ok) {
        toast({ kind: "error", title: "Upgrade", message: data?.error || "Aankoop starten mislukt." });
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      toast({ kind: "error", title: "Upgrade", message: "Geen checkoutUrl ontvangen." });
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Sluiten" type="button" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[min(920px,94vw)] overflow-hidden rounded-[28px] border border-white/10 bg-[#1e1b27] shadow-2xl">
          <div className="relative px-6 py-6 sm:px-8 sm:py-8">
            <div className="absolute -left-36 -top-40 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -right-40 -bottom-44 h-[520px] w-[520px] rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-2xl font-semibold text-white">Investeer in diepgang</div>
                <div className="mt-1 text-sm text-white/70">
                  Tokens voor Depth tools & match-slot verlenging.
                  {reason ? <span className="ml-2 text-white/45">({reason})</span> : null}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-white/80 hover:bg-white/10"
                aria-label="Sluiten"
                title="Sluiten"
              >
                ✕
              </button>
            </div>

            <div className="relative mt-5">
              {packsLoading ? <div className="mb-3 text-sm text-white/60">Pakketten laden…</div> : null}

              <div className="grid gap-3 md:grid-cols-3">
                {list.map((p) => (
                  <div
                    key={p.key}
                    className={cls(
                      "relative overflow-hidden rounded-3xl border p-4",
                      p.highlight ? "border-emerald-400/25 bg-emerald-400/10" : "border-white/10 bg-black/20"
                    )}
                  >
                    {p.highlight ? (
                      <div className="absolute right-3 top-3 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                        Meest gekozen
                      </div>
                    ) : null}

                    <div className="text-base font-semibold text-white/90">{p.title}</div>

                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div className="text-3xl font-semibold text-white">{p.tokens}</div>
                      <div className="pb-1 text-sm text-white/70">{p.priceLabel}</div>
                    </div>

                    <div className="mt-2 text-xs text-white/55">{p.subtitle}</div>

                    <Button
                      onClick={() => void startPurchase(p.key)}
                      disabled={!!buying}
                      className={cls("mt-4 w-full rounded-2xl", p.highlight ? "" : "opacity-95")}
                    >
                      {buying === p.key ? "Even…" : "Kopen"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={onClose} className="rounded-2xl">
                Later
              </Button>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => (window.location.href = "/wallet")} className="rounded-2xl">
                  Naar wallet
                </Button>
                <Button onClick={() => void startPurchase("EXPLORER")} disabled={!!buying} className="rounded-2xl">
                  Kies Explorer
                </Button>
              </div>
            </div>

            <div className="relative mt-4 text-center text-xs text-white/45">
              Door te kopen ga je akkoord met de checkoutvoorwaarden van de betaalprovider.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
