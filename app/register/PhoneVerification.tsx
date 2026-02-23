"use client";

import { useState } from "react";

export function PhoneVerification({
  onVerified,
}: {
  onVerified: (phone: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "verified">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "REGISTER" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Kon geen code sturen");
      setStatus("sent");
    } catch (e: any) {
      setError(e.message || "Fout");
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
        body: JSON.stringify({ phone, code, purpose: "REGISTER" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Code onjuist");
      setStatus("verified");
      onVerified(phone);
    } catch (e: any) {
      setError(e.message || "Fout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border p-3">
      <div className="text-sm font-semibold">Telefoon verificatie</div>

      <input
        className="w-full rounded-lg border px-3 py-2"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+32470123456"
      />

      {status !== "idle" && (
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="6-cijferige code"
          inputMode="numeric"
        />
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={start}
          disabled={loading || !phone}
          className="rounded-lg bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          Stuur code
        </button>

        <button
          type="button"
          onClick={verify}
          disabled={loading || status === "idle" || code.length !== 6}
          className="rounded-lg border px-3 py-2 disabled:opacity-50"
        >
          Verifieer
        </button>
      </div>

      {status === "verified" && (
        <div className="text-sm text-green-700">Nummer geverifieerd ✅</div>
      )}

      <div className="text-xs text-gray-500">
        (Dev) De code staat momenteel in je terminal logs.
      </div>
    </div>
  );
}
