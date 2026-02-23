"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { Button } from "@/components/Button";

export function CityEditor({ initialCity }: { initialCity: string }) {
  const router = useRouter();
  const [city, setCity] = useState(initialCity || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.set("city", city);
      const res = await fetch("/api/profile/city", { method: "POST", body: form });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data.ok) {
        setMsg(data.error || "Opslaan mislukt.");
        return;
      }
      setMsg("Stad bijgewerkt.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium text-zinc-100">Stad / gemeente</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <CityAutocomplete name="city" value={city} onChange={setCity} placeholder="Begin te typen…" />
        </div>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Opslaan…" : "Opslaan"}
        </Button>
      </div>
      {msg && <div className="text-sm text-zinc-400">{msg}</div>}
    </div>
  );
}
