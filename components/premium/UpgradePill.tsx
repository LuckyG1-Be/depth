"use client";

import { usePremium } from "@/components/premium/PremiumProvider";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function UpgradePill({ className, reason }: { className?: string; reason?: string }) {
  const { balance, freeRemaining, openUpgrade } = usePremium();

  return (
    <button
      type="button"
      onClick={() => openUpgrade(reason ?? "pill")}
      className={cls(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80",
        "hover:bg-white/10",
        className
      )}
      title="Upgrade"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-[12px] text-emerald-100">
        ↑
      </span>
      <span>Upgrade</span>
      <span className="text-xs font-normal text-white/55">
        {typeof balance === "number" ? `${balance} tokens` : "—"}
        {typeof freeRemaining === "number" ? ` • free ${freeRemaining}` : ""}
      </span>
    </button>
  );
}
