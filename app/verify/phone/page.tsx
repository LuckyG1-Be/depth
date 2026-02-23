"use client";

import { useState } from "react";

type Status = "idle" | "sent" | "verified";

function cleanPhone(input: string) {
  return input.trim().replace(/[^\d+]/g, "");
}

export default function VerifyPhonePage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "LINK" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Kon geen code sturen");
      setStatus("sent");
    } catch (e: any) {
      setError(e?.message || "Fout");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, purpose: "LINK" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Code onjuist");
      setStatus("verified");
      window.location.href = "/discover";
    } catch (e: any) {
      setError(e?.message || "Fout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <h1 className="text-xl font-semibold text-zinc-50">Verifieer je telefoon</h1>
        <p className="mt-2 text-sm text-zinc-300">
          DEPTH vereist één geverifieerd nummer per account om fake profielen te beperken.
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          Dev: de code staat in je terminal logs (later koppel je SMS-provider).
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div>
          <label className="block text-xs text-zinc-400">Telefoonnummer (E.164)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(cleanPhone(e.target.value))}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-zinc-500"
            placeholder="+32470123456"
          />
        </div>

        {status !== "idle" && (
          <div>
            <label className="block text-xs text-zinc-400">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-zinc-500"
              placeholder="6 cijfers"
              inputMode="numeric"
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={start}
            disabled={loading || !phone || status === "verified"}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
          >
            Stuur code
          </button>

          <button
            type="button"
            onClick={verify}
            disabled={loading || status === "idle" || code.length !== 6 || status === "verified"}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
          >
            Verifieer
          </button>
        </div>

        {status === "verified" && (
          <div className="text-sm text-green-300">Geverifieerd ✅ Je wordt doorgestuurd…</div>
        )}
      </div>
    </div>
  );
}

