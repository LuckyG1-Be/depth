"use client";

import Link from "next/link";
import { useState } from "react";

type Stage = "idle" | "sent" | "busy" | "verified";
const messages: Record<string, string> = {
  EMAIL_NOT_CONFIGURED: "E-mailverificatie is nog niet geconfigureerd.",
  EMAIL_SEND_FAILED: "De e-mail kon niet worden verstuurd. Probeer opnieuw.",
  INVALID_CODE: "Deze code is niet juist.",
  EXPIRED: "Deze code is verlopen. Vraag een nieuwe code aan.",
  TOO_MANY_ATTEMPTS: "Te veel pogingen. Vraag een nieuwe code aan.",
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const busy = stage === "busy";
  const reset = () => { setStage("idle"); setCode(""); setError(null); setSubmitError(null); };

  async function sendCode() {
    setError(null);
    if (!email.includes("@")) { setError("Vul eerst een geldig e-mailadres in."); return; }
    setStage("busy");
    try {
      const response = await fetch("/api/auth/email/start", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messages[data?.error] || data?.error || "Kon geen code sturen.");
      setStage("sent");
    } catch (err: any) { setStage("idle"); setError(err?.message || "Kon geen code sturen."); }
  }

  async function verifyCode() {
    setError(null);
    if (code.length !== 6) { setError("Vul de 6-cijferige code in."); return; }
    setStage("busy");
    try {
      const response = await fetch("/api/auth/email/verify", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, code }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messages[data?.error] || data?.error || "Code onjuist.");
      setStage("verified");
    } catch (err: any) { setStage("sent"); setError(err?.message || "Verificatie mislukt."); }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitError(null);
    if (stage !== "verified") { setSubmitError("Verifieer eerst je e-mailadres."); return; }
    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget); form.set("email", email);
      const response = await fetch("/api/auth/register", { method: "POST", body: form, credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setSubmitError(data?.error === "EMAIL_VERIFICATION_REQUIRED" ? "Verifieer opnieuw je e-mailadres." : data?.error || "Registratie mislukt."); return; }
      window.location.href = "/discover";
    } catch (err: any) { setSubmitError(err?.message || "Registratie mislukt."); } finally { setSubmitting(false); }
  }

  const input = "mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500";
  return <div className="depth-enter mx-auto max-w-lg px-4 py-10">
    <div className="mb-6"><h1 className="text-2xl font-bold text-zinc-50">Registreren</h1><p className="mt-1 text-sm text-zinc-400">Maak in twee korte stappen een veilig account.</p><div className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><span className="h-1.5 flex-1 rounded-full bg-emerald-400" /><span className="h-1.5 flex-1 rounded-full bg-zinc-800" /><span>Stap 1 van 2</span></div></div>
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="depth-rise rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex items-center justify-between"><div><div className="text-sm font-semibold text-zinc-50">E-mailverificatie</div><div className="mt-1 text-xs text-zinc-400">Goedkoper en betrouwbaarder dan sms.</div></div>{stage === "verified" && <span className="rounded-full border border-green-900 bg-green-950 px-2 py-1 text-xs text-green-200">Geverifieerd</span>}</div>
        <div className="mt-3 flex gap-2"><input id="register-email" type="email" value={email} onChange={(event) => { if (stage === "verified") reset(); setEmail(event.target.value.trim().toLowerCase()); }} placeholder="naam@domein.be" autoComplete="email" className={input} disabled={stage === "verified" || busy} required />{stage === "verified" ? <button type="button" onClick={() => { setEmail(""); reset(); }} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-100">Wijzig</button> : <button type="button" onClick={sendCode} disabled={!email || busy} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50">{busy ? "..." : "Stuur code"}</button>}</div>
        {(stage === "sent" || stage === "busy") && <div className="mt-3 flex gap-2"><input id="register-email-code" value={code} onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, "").slice(0, 6))} placeholder="6 cijfers" inputMode="numeric" autoComplete="one-time-code" className={input} disabled={busy} /><button type="button" onClick={verifyCode} disabled={busy || code.length !== 6} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50">Verifieer</button></div>}{error && <div className="mt-3 rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">{error}</div>}
      </section>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div className="grid gap-3"><label className="text-xs text-zinc-400">Voornaam<input name="name" required minLength={2} autoComplete="given-name" className={input} placeholder="Voornaam" /></label><label className="text-xs text-zinc-400">Wachtwoord<input name="password" type="password" required minLength={6} autoComplete="new-password" className={input} placeholder="Min. 6 tekens" /></label><label className="text-xs text-zinc-400">Stad<input name="city" required autoComplete="address-level2" className={input} placeholder="Bijv. Gent" /></label><label className="text-xs text-zinc-400">Geboortedatum<input name="birthdate" type="date" required className={input} /><span className="mt-1 block text-xs text-zinc-500">Je moet 18+ zijn.</span></label><div className="grid grid-cols-2 gap-3"><label className="text-xs text-zinc-400">Geslacht<select name="gender" required defaultValue="Man" className={input}><option>Man</option><option>Vrouw</option><option>X</option></select></label><label className="text-xs text-zinc-400">Ik zoek<select name="lookingFor" required defaultValue="Vrouw" className={input}><option>Man</option><option>Vrouw</option><option>X</option></select></label></div></div></section>
      {submitError && <div className="rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">{submitError}</div>}<button type="submit" disabled={stage !== "verified" || submitting} className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-zinc-900 disabled:opacity-50">{submitting ? "Bezig..." : stage !== "verified" ? "Verifieer eerst je e-mailadres" : "Account maken"}</button><div className="text-center text-sm text-zinc-400">Heb je al een account? <Link className="text-zinc-100 underline" href="/login">Log in</Link></div>
    </form>
  </div>;
}
