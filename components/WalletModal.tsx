// components/WalletModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/ToastProvider";

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

type LimitsResp = { ok: boolean; packs?: Pack[] };

type SnapshotApi = {
  ok: boolean;
  wallet?: { balance?: number };
  free?: { used?: number; remaining?: number; total?: number };
};

type StartResp = {
  ok: boolean;
  purchaseId?: string;
  checkoutUrl?: string;
  error?: string;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function idem(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function readJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);

  const [balance, setBalance] = useState<number>(0);
  const [freeRemaining, setFreeRemaining] = useState<number>(0);

  const [packs, setPacks] = useState<Pack[]>([]);

  const fallbackPacks = useMemo<Pack[]>(
    () => [
      { key: "STARTER", title: "Starter", subtitle: "Voor af en toe een Depth-moment.", tokens: 8, amountCents: 900, currency: "EUR", priceLabel: "€ 9" },
      { key: "EXPLORER", title: "Explorer", subtitle: "De sweet spot voor actief chatten.", tokens: 20, amountCents: 1799, currency: "EUR", priceLabel: "€ 17,99", highlight: true },
      { key: "INTENT", title: "Intent", subtitle: "Voor een maand vol diepgang.", tokens: 50, amountCents: 3999, currency: "EUR", priceLabel: "€ 39,99" },
    ],
    []
  );

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function load() {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/wallet/snapshot", { cache: "no-store" }).catch(() => null),
        fetch("/api/wallet/limits", { cache: "no-store" }).catch(() => null),
      ]);

      if (a?.ok) {
        const j = await readJsonSafe<SnapshotApi>(a);
        if (j?.ok) {
          if (typeof j.wallet?.balance === "number") setBalance(j.wallet.balance);
          if (typeof j.free?.remaining === "number") setFreeRemaining(j.free.remaining);
        }
      }

      if (b?.ok) {
        const j = await readJsonSafe<LimitsResp>(b);
        if (j?.ok && Array.isArray(j.packs) && j.packs.length) setPacks(j.packs);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load();
  }, [open]);

  async function startPurchase(packKey: string) {
    if (buying) return;
    setBuying(packKey);

    try {
      const res = await fetch("/api/wallet/purchase/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packKey, idemKey: idem(`purchase_${packKey}`) }),
      });

      const j = await readJsonSafe<StartResp>(res);
      if (!res.ok || !j?.ok) {
        toast({ kind: "error", title: "Aankoop mislukt", message: j?.error || "Probeer opnieuw." });
        return;
      }

      if (j.checkoutUrl) {
        window.location.href = j.checkoutUrl;
        return;
      }

      toast({ kind: "error", title: "Aankoop mislukt", message: "Geen checkoutUrl ontvangen." });
    } finally {
      setBuying(null);
    }
  }

  if (!open) return null;

  const list = packs.length ? packs : fallbackPacks;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Sluiten" type="button" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[min(820px,94vw)] overflow-hidden rounded-3xl border border-white/10 bg-[#1e1b27] shadow-2xl">
          <div className="relative px-6 py-6">
            <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -right-36 -bottom-40 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl font-semibold text-white">Wallet</div>
                <div className="mt-1 text-sm text-white/70">
                  Tokens: <span className="font-semibold text-white/90">{balance}</span> • free:{" "}
                  <span className="font-semibold text-white/90">{freeRemaining}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-white/80 hover:bg-white/10"
                aria-label="Sluiten"
              >
                ✕
              </button>
            </div>

            <div className="relative mt-4 grid gap-3 md:grid-cols-3">
              {list.map((p) => (
                <div
                  key={p.key}
                  className={cls(
                    "rounded-3xl border p-4",
                    p.highlight ? "border-emerald-400/25 bg-emerald-400/10" : "border-white/10 bg-black/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-semibold text-white/90">{p.title}</div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70">
                      {p.priceLabel}
                    </div>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="text-3xl font-semibold text-white">{p.tokens}</div>
                    <div className="pb-1 text-sm text-white/55">tokens</div>
                  </div>

                  <div className="mt-2 text-xs text-white/55">{p.subtitle}</div>

                  <Button onClick={() => void startPurchase(p.key)} disabled={!!buying} className="mt-4 w-full rounded-2xl">
                    {buying === p.key ? "Even…" : "Kopen"}
                  </Button>
                </div>
              ))}
            </div>

            <div className="relative mt-5 flex items-center justify-between">
              <Button variant="ghost" className="rounded-2xl" onClick={() => void load()} disabled={loading}>
                {loading ? "Laden…" : "Refresh"}
              </Button>

              <Button className="rounded-2xl" onClick={() => (window.location.href = "/wallet")}>
                Open wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
