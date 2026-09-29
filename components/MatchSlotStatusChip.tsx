"use client";

import { useEffect, useMemo, useState } from "react";

type LimitsResp = {
  ok: boolean;
  matchSlots?: {
    extensionActive?: boolean;
    extensionEndsAt?: string | null;
  };
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function msToShort(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}u ${m}m`;
}

export default function MatchSlotStatusChip() {
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/wallet/limits", { cache: "no-store" });
        const j = (await res.json().catch(() => null)) as LimitsResp | null;
        if (!alive) return;

        const a = Boolean(j?.ok && j?.matchSlots?.extensionActive);
        const e = typeof j?.matchSlots?.extensionEndsAt === "string" ? j!.matchSlots!.extensionEndsAt! : null;

        setActive(a);
        setEndsAt(e || null);
      } catch {
        if (!alive) return;
        setActive(false);
        setEndsAt(null);
      }
    }

    void load();

    // refresh on slot changes
    const on = () => void load();
    window.addEventListener("depth:match-slot-changed", on);
    return () => {
      alive = false;
      window.removeEventListener("depth:match-slot-changed", on);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const timeLeft = useMemo(() => {
    if (!active || !endsAt) return null;
    const end = new Date(endsAt).getTime();
    if (!Number.isFinite(end)) return null;
    return msToShort(end - now);
  }, [active, endsAt, now]);

  if (!active || !endsAt) return null;

  return (
    <span
      className={cls(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
        "border-emerald-400/30 bg-emerald-400/12 text-emerald-100"
      )}
      title="Extra match-slot actief"
    >
      +1 slot
      {timeLeft ? <span className="font-normal text-emerald-100/75">• {timeLeft}</span> : null}
    </span>
  );
}
