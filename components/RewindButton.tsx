"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export function RewindButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    if (!enabled || loading) return;
    setLoading(true);
    setMsg(null);

    try {
      const y = window.scrollY;
      const res = await fetch("/api/discover/rewind", { method: "POST" });
      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        if (data?.error === "PREMIUM_ONLY") setMsg("Rewind is Premium.");
        else if (data?.error === "REWIND_LIMIT") setMsg("Rewind is vandaag al gebruikt.");
        else setMsg("Rewind niet gelukt.");
        return;
      }

      setMsg(data?.rewound ? "Rewind uitgevoerd." : "Niets om terug te draaien.");

      router.refresh();
      requestAnimationFrame(() => window.scrollTo(0, y));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" type="button" onClick={run} disabled={!enabled || loading}>
        Rewind
      </Button>
      {msg && <div className="text-xs text-zinc-500">{msg}</div>}
    </div>
  );
}

