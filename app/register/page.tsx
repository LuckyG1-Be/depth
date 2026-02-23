"use client";

import Link from "next/link";
import { useState } from "react";

type OtpStage = "idle" | "sent" | "busy" | "verified";

function cleanPhone(input: string) {
  return input.trim().replace(/[^\d+]/g, "");
}

export default function RegisterPage() {
  // Phone verify
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<OtpStage>("idle");
  const [otpError, setOtpError] = useState<string | null>(null);

  // Register form
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isBusy = stage === "busy";
  const canSend = !!phone && stage !== "verified" && !isBusy;
  const canVerify = stage === "sent" && code.length === 6 && !isBusy;
  const canRegister = stage === "verified" && !submitting;

  async function startOtp() {
    setOtpError(null);
    setSubmitError(null);

    if (!phone) {
      setOtpError("Vul eerst een telefoonnummer in.");
      return;
    }

    try {
      setStage("busy");
      const res = await fetch("/api/auth/phone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, purpose: "REGISTER" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Kon geen code sturen.");

      setStage("sent");
    } catch (e: any) {
      setStage("idle");
      setOtpError(e?.message || "Fout bij versturen.");
    }
  }

  async function verifyOtp() {
    setOtpError(null);
    setSubmitError(null);

    if (code.length !== 6) {
      setOtpError("Vul de 6-cijferige code in.");
      return;
    }

    try {
      setStage("busy");

      // 1) verify => should set httpOnly verify cookie
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, code, purpose: "REGISTER" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Code onjuist.");

      // 2) confirm server sees cookie
      const s = await fetch("/api/auth/phone/status", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const status = await s.json().catch(() => ({}));

      if (!status?.ok) {
        throw new Error(
          "Verificatie gelukt, maar cookie werd niet opgeslagen. Refresh en probeer opnieuw."
        );
      }

      // extra check: phone must match
      if (String(status.phone || "") !== cleanPhone(phone)) {
        throw new Error("Telefoonnummer mismatch. Probeer opnieuw.");
      }

      setStage("verified");
    } catch (e: any) {
      setStage("sent");
      setOtpError(e?.message || "Fout bij verificatie.");
    }
  }

  function resetPhone() {
    setStage("idle");
    setCode("");
    setOtpError(null);
    setSubmitError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if (stage !== "verified") {
      setSubmitError("Verifieer eerst je telefoonnummer.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("phone", phone);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: fd,
        credentials: "include",
        redirect: "follow",
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.error || "Registratie mislukt.");
        return;
      }

      window.location.href = "/discover";
    } catch (e: any) {
      setSubmitError(e?.message || "Registratie mislukt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Registreren</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Telefoonverificatie is verplicht. De rest van je profiel vul je nadien aan.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* PHONE VERIFY */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-50">Telefoon verificatie</div>
            {stage === "verified" && (
              <span className="text-xs rounded-full border border-green-900 bg-green-950 px-2 py-1 text-green-200">
                Geverifieerd
              </span>
            )}
          </div>

          <label className="mt-3 block text-xs text-zinc-400">Telefoonnummer (E.164)</label>
          <div className="mt-1 flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const v = cleanPhone(e.target.value);
                if (stage === "verified") resetPhone();
                setPhone(v);
              }}
              placeholder="+32470123456"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              disabled={stage === "verified" || isBusy}
            />

            {stage === "verified" ? (
              <button
                type="button"
                onClick={() => {
                  setPhone("");
                  resetPhone();
                }}
                className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
              >
                Wijzig
              </button>
            ) : (
              <button
                type="button"
                onClick={startOtp}
                disabled={!canSend}
                className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
              >
                {isBusy ? "..." : "Stuur code"}
              </button>
            )}
          </div>

          {(stage === "sent" || stage === "busy") && (
            <>
              <label className="mt-3 block text-xs text-zinc-400">Verificatiecode</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                  placeholder="6 cijfers"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                  disabled={isBusy}
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={!canVerify}
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
                >
                  {isBusy ? "Bezig..." : "Verifieer"}
                </button>
              </div>
            </>
          )}

          {otpError && (
            <div className="mt-3 rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
              {otpError}
            </div>
          )}

          <div className="mt-3 text-xs text-zinc-500">
            Dev: verificatiecode staat in je terminal logs.
          </div>
        </div>

        {/* BASIC REGISTER FIELDS */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="grid gap-3">
            <div>
              <label className="block text-xs text-zinc-400">Voornaam</label>
              <input
                name="name"
                required
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                placeholder="Voornaam"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400">E-mail</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                placeholder="naam@domein.be"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400">Wachtwoord</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                placeholder="Min. 6 tekens"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400">Stad</label>
              <input
                name="city"
                required
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                placeholder="Bijv. Gent"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400">Geboortedatum</label>
              <input
                name="birthdate"
                type="date"
                required
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
              <div className="mt-1 text-xs text-zinc-500">Je moet 18+ zijn.</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400">Geslacht</label>
                <select
                  name="gender"
                  required
                  defaultValue="Man"
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                >
                  <option value="Man">Man</option>
                  <option value="Vrouw">Vrouw</option>
                  <option value="X">X</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400">Ik zoek</label>
                <select
                  name="lookingFor"
                  required
                  defaultValue="Vrouw"
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                >
                  <option value="Man">Man</option>
                  <option value="Vrouw">Vrouw</option>
                  <option value="X">X</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={!canRegister}
          className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-zinc-900 disabled:opacity-50"
        >
          {submitting ? "Bezig..." : stage !== "verified" ? "Verifieer eerst je nummer" : "Account maken"}
        </button>

        <div className="text-center text-sm text-zinc-400">
          Heb je al een account?{" "}
          <Link className="text-zinc-100 underline" href="/login">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}

