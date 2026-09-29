"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/ToastProvider";

async function readJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function DevCheckoutClient({ purchaseId, alreadyPaid }: { purchaseId: string; alreadyPaid: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function confirmPaid() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/wallet/purchase/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok || !data?.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Kon niet bevestigen.";
        toast({ kind: "error", message: msg });
        return;
      }

      toast({ kind: "success", message: "Simulatie gelukt: tokens toegevoegd." });
      router.push(`/wallet?purchase=${purchaseId}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={confirmPaid} disabled={busy || alreadyPaid} className="w-full rounded-2xl">
        {alreadyPaid ? "Reeds betaald" : busy ? "Even…" : "Simuleer betaald"}
      </Button>

      <Button
        variant="ghost"
        onClick={() => {
          router.push("/wallet");
          router.refresh();
        }}
        className="w-full rounded-2xl"
      >
        Terug naar wallet
      </Button>
    </div>
  );
}
