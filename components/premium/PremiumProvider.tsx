// components/premium/PremiumProvider.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import UpgradeModal from "@/components/premium/UpgradeModal";

type Snapshot = {
  ok: boolean;
  balance: number;
  freeUsed: number;
  freeRemaining: number;
  freeTotal: number;
};

type PremiumContextValue = {
  balance: number | null;
  freeRemaining: number | null;
  freeUsed: number | null;
  freeTotal: number | null;

  // ✅ keep both names (some components might use loading)
  isLoading: boolean;
  loading: boolean;

  refresh: () => Promise<void>;
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;
  upgradeOpen: boolean;
  upgradeReason: string | null;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

async function readJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberField(record: Record<string, unknown> | null, key: string): number | null {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseSnapshot(raw: unknown): Snapshot | null {
  if (!isRecord(raw) || raw.ok !== true) return null;

  // New API shape:
  // { ok:true, wallet:{balance}, free:{used,remaining,total}, ... }
  const wallet = isRecord(raw.wallet) ? raw.wallet : null;
  const free = isRecord(raw.free) ? raw.free : null;
  const walletBal = numberField(wallet, "balance");
  const freeUsed = numberField(free, "used");
  const freeRem = numberField(free, "remaining");
  const freeTotal = numberField(free, "total");

  if (typeof walletBal === "number") {
    return {
      ok: true,
      balance: walletBal,
      freeUsed: typeof freeUsed === "number" ? freeUsed : 0,
      freeRemaining: typeof freeRem === "number" ? freeRem : 0,
      freeTotal: typeof freeTotal === "number" ? freeTotal : 0,
    };
  }

  // Legacy shape fallback:
  // { ok:true, balance, freeUsed, freeRemaining }
  const legacyBalance = numberField(raw, "balance");
  if (typeof legacyBalance === "number") {
    return {
      ok: true,
      balance: legacyBalance,
      freeUsed: numberField(raw, "freeUsed") ?? 0,
      freeRemaining: numberField(raw, "freeRemaining") ?? 0,
      freeTotal: numberField(raw, "freeTotal") ?? 0,
    };
  }

  return null;
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/wallet/snapshot", { cache: "no-store" }).catch(() => null);
      if (!res || !res.ok) return;

      const j = await readJsonSafe(res);
      const snap = parseSnapshot(j);
      if (snap?.ok) setSnapshot(snap);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const on = () => void refresh();
    window.addEventListener("depth:wallet-changed", on);
    return () => window.removeEventListener("depth:wallet-changed", on);
  }, [refresh]);

  const openUpgrade = useCallback((reason?: string) => {
    setUpgradeReason(reason ? String(reason) : null);
    setUpgradeOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => {
    setUpgradeOpen(false);
  }, []);

  const value = useMemo<PremiumContextValue>(
    () => ({
      balance: typeof snapshot?.balance === "number" ? snapshot.balance : null,
      freeRemaining: typeof snapshot?.freeRemaining === "number" ? snapshot.freeRemaining : null,
      freeUsed: typeof snapshot?.freeUsed === "number" ? snapshot.freeUsed : null,
      freeTotal: typeof snapshot?.freeTotal === "number" ? snapshot.freeTotal : null,

      isLoading,
      loading: isLoading, // ✅ alias

      refresh,
      openUpgrade,
      closeUpgrade,
      upgradeOpen,
      upgradeReason,
    }),
    [snapshot, isLoading, refresh, openUpgrade, closeUpgrade, upgradeOpen, upgradeReason]
  );

  return (
    <PremiumContext.Provider value={value}>
      {children}
      <UpgradeModal open={upgradeOpen} onClose={closeUpgrade} reason={upgradeReason} />
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
}
