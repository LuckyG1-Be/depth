"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const GREEN = "#66b96c";
const BG = "#1e1b27";

type WalletMeResp = {
  ok: boolean;
  balance?: number;
  freeRemaining?: number;
};

async function readJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function WalletPill() {
  const [balance, setBalance] = useState<number>(0);
  const [freeRemaining, setFreeRemaining] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  async function load() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const res = await fetch("/api/wallet/me", { cache: "no-store", signal: ac.signal }).catch(() => null);
    if (!res || !res.ok) return;

    const data = await readJsonSafe<WalletMeResp>(res);
    if (!data?.ok) return;

    if (typeof data.balance === "number") setBalance(data.balance);
    if (typeof data.freeRemaining === "number") setFreeRemaining(data.freeRemaining);
    setLoaded(true);
  }

  useEffect(() => {
    void load();

    const onFocus = () => void load();
    const onWalletChanged = () => void load();

    window.addEventListener("focus", onFocus);
    window.addEventListener("depth:wallet-changed", onWalletChanged);

    const t = setInterval(() => void load(), 60_000);

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("depth:wallet-changed", onWalletChanged);
      clearInterval(t);
    };
  }, []);

  return (
    <Link
      href="/wallet"
      className="inline-flex items-center gap-2 rounded-3xl border px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        borderColor: "rgba(102,185,108,0.35)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.90)",
      }}
      aria-label="Wallet"
      title="Wallet"
    >
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-2xl border"
        style={{
          borderColor: "rgba(102,185,108,0.35)",
          background: "rgba(102,185,108,0.12)",
          color: GREEN,
        }}
      >
        ⟡
      </span>

      <span className="whitespace-nowrap">
        {loaded ? (
          <>
            <span style={{ color: GREEN }}>{balance}</span> tokens
            <span className="ml-2 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
              gratis: {freeRemaining}
            </span>
          </>
        ) : (
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
            Wallet...
          </span>
        )}
      </span>

      <span className="text-white/40">›</span>
    </Link>
  );
}
