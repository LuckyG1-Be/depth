"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useRouter } from "next/navigation";

export function ChatSafetyActions({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function post(path: string) {
    setLoading(true);
    setToast(null);
    try {
      const fd = new FormData();
      fd.append("matchId", matchId);
      const res = await fetch(path, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok !== true) {
        setToast("Actie mislukt. Probeer opnieuw.");
        return;
      }
      router.push("/matches");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {toast && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {toast}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" disabled={loading} onClick={() => setReportOpen(true)}>
          Rapporteren
        </Button>
        <Button variant="ghost" disabled={loading} onClick={() => setBlockOpen(true)}>
          Blokkeren
        </Button>
      </div>

      <ConfirmDialog
        open={reportOpen}
        title="Rapporteren"
        message="Wil je dit profiel rapporteren? We markeren het voor review."
        confirmText="Rapporteer"
        danger
        onCancel={() => setReportOpen(false)}
        onConfirm={() => {
          setReportOpen(false);
          post("/api/match/report");
        }}
      />

      <ConfirmDialog
        open={blockOpen}
        title="Blokkeren"
        message="Wil je deze persoon blokkeren? De match verdwijnt en komt niet terug in Ontdekken."
        confirmText="Blokkeer"
        danger
        onCancel={() => setBlockOpen(false)}
        onConfirm={() => {
          setBlockOpen(false);
          post("/api/match/block");
        }}
      />
    </div>
  );
}
