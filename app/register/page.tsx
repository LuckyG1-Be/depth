"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

type Stage = "idle" | "sent" | "busy" | "verified";
const inputClass = "depth-input mt-1 w-full px-4 py-3 text-sm placeholder:text-white/30";

function Label({ children }: { children: ReactNode }) { return <label className="block text-xs font-semibold uppercase tracking-[.14em] text-white/40">{children}</label>; }
function message(data: Record<string, unknown>, fallback: string) { return typeof data.error === "string" ? data.error : fallback; }

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = stage === "busy";
  const canSend = Boolean(email) && stage !== "verified" && !busy && cooldown === 0;
  const canRegister = stage === "verified" && adult && terms && dataConsent && !submitting;

  useEffect(() => { if (cooldown <= 0) return; const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [cooldown]);

  async function sendCode() {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) { setError("Vul een geldig e-mailadres in."); return; }
    setStage("busy"); setError(null); setSubmitError(null);
    try {
      const response = await fetch("/api/auth/email/start", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email: normalized }) });
      const data = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (!response.ok) throw new Error(message(data, "Kon geen code sturen."));
      setEmail(normalized); setStage("sent"); setCooldown(30);
    } catch (err) { setStage("idle"); setError(err instanceof Error ? err.message : "Kon geen code sturen."); }
  }

  async function verifyCode() {
    if (code.length !== 6) { setError("Vul de volledige code van 6 cijfers in."); return; }
    setStage("busy"); setError(null);
    try {
      const response = await fetch("/api/auth/email/verify", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email: email.trim().toLowerCase(), code }) });
      const data = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (!response.ok) throw new Error(message(data, "Deze code klopt niet of is verlopen."));
      setStage("verified");
    } catch (err) { setStage("sent"); setError(err instanceof Error ? err.message : "Deze code klopt niet of is verlopen."); }
  }

  function resetEmail() { setEmail(""); setCode(""); setStage("idle"); setCooldown(0); setError(null); setSubmitError(null); }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitError(null);
    if (!stage || stage !== "verified") { setSubmitError("Verifieer eerst je e-mailadres."); return; }
    if (!adult) { setSubmitError("Bevestig dat je minstens 18 jaar bent."); return; }
    if (!terms || !dataConsent) { setSubmitError("Accepteer de voorwaarden en geef toestemming voor matchinggegevens."); return; }
    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget); form.set("email", email.trim().toLowerCase());
      const response = await fetch("/api/auth/register", { method: "POST", body: form, credentials: "include" });
      const data = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (!response.ok) { setSubmitError(message(data, "Registratie lukt niet. Probeer opnieuw.")); return; }
      window.location.href = "/discover";
    } catch (err) { setSubmitError(err instanceof Error ? err.message : "Registratie lukt niet. Probeer opnieuw."); } finally { setSubmitting(false); }
  }

  return <main className="min-h-screen bg-[#1e1b27] px-4 py-[max(24px,env(safe-area-inset-top))] sm:px-6 sm:py-10"><div className="mx-auto w-full max-w-xl">
    <div className="mb-5 text-center"><img src="/depth-logo.svg" alt="Depth" className="mx-auto h-14 w-auto" /><h1 className="mt-5 text-2xl font-semibold tracking-[-.02em] text-white">Start met Depth</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">Account → profiel → foto’s → verificatie → Discover.</p></div>
    <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-white/60 sm:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">Min. 4 foto’s</div><div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">Selfie-check</div><div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">Veilige foto’s</div><div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">Gratis bij launch</div></div>
    <form onSubmit={onSubmit} className="space-y-4">
      <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-white">E-mail verifiëren</h2><p className="mt-1 text-sm text-white/50">We sturen een eenmalige code van 6 cijfers.</p></div>{stage === "verified" ? <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-50">Geverifieerd</span> : null}</div><div className="mt-4 grid gap-3"><div><Label>E-mail</Label><div className="mt-1 flex flex-col gap-2 sm:flex-row"><input type="email" autoComplete="email" value={email} onChange={(event) => { if (stage === "verified") resetEmail(); setEmail(event.target.value.toLowerCase()); }} placeholder="naam@domein.be" className={inputClass} disabled={stage === "verified" || busy} required />{stage === "verified" ? <Button type="button" variant="secondary" onClick={resetEmail}>Wijzig</Button> : <Button type="button" onClick={sendCode} disabled={!canSend}>{busy ? "Bezig…" : stage === "sent" ? cooldown > 0 ? `Opnieuw in ${cooldown}s` : "Stuur opnieuw" : "Stuur code"}</Button>}</div></div>{stage === "sent" || stage === "busy" ? <div><Label>Verificatiecode</Label><div className="mt-1 flex flex-col gap-2 sm:flex-row"><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 cijfers" inputMode="numeric" autoComplete="one-time-code" className={inputClass} disabled={busy} /><Button type="button" variant="secondary" onClick={verifyCode} disabled={busy || code.length !== 6}>Verifieer</Button></div><p className="mt-2 text-xs text-white/40">Geen mail? Controleer je spamfolder of vraag na de wachttijd een nieuwe code.</p></div> : null}{error ? <div className="rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-50">{error}</div> : null}</div></Card>
      <div className="depth-card p-4 sm:p-5"><h2 className="text-base font-semibold text-white">Accountgegevens</h2><div className="mt-4 grid gap-3"><div><Label>Voornaam</Label><input name="name" required minLength={2} maxLength={50} autoComplete="given-name" className={inputClass} placeholder="Voornaam" /></div><div><Label>E-mail</Label><input name="email" type="email" required value={email} readOnly className={inputClass} /><div className="mt-1 text-xs text-white/40">Moet eerst hierboven geverifieerd worden.</div></div><div><Label>Wachtwoord</Label><input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className={inputClass} placeholder="Min. 8 tekens" /></div><div><Label>Geboortedatum</Label><input name="birthdate" type="date" required autoComplete="bday" className={inputClass} /><div className="mt-1 text-xs text-white/40">Je moet minstens 18 jaar zijn.</div></div><div><Label>Geslacht</Label><select name="gender" required defaultValue="Man" className={inputClass}><option value="Man">Man</option><option value="Vrouw">Vrouw</option><option value="X">X</option></select></div></div></div>
      <div className="depth-card p-4 sm:p-5"><h2 className="text-base font-semibold text-white">Veiligheid en akkoord</h2><div className="mt-3 space-y-3 text-sm text-white/72"><label className="flex gap-3 rounded-2xl border border-white/10 bg-black/15 p-3"><input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-300" required /><span>Ik ben minstens 18 jaar en mijn geboortedatum klopt.</span></label><label className="flex gap-3 rounded-2xl border border-white/10 bg-black/15 p-3"><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-300" required /><span>Ik ga akkoord met de <Link href="/privacy" className="font-semibold text-white underline">voorwaarden en het privacybeleid</Link>.</span></label><label className="flex gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[.06] p-3"><input type="checkbox" checked={dataConsent} onChange={(event) => setDataConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-300" required /><span>Ik geef toestemming dat Depth mijn ingevulde matchinggegevens verwerkt voor matching, veiligheid en gebruik van de app.</span></label></div></div>
      {submitError ? <div className="rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-50">{submitError}</div> : null}<Button type="submit" disabled={!canRegister} className="min-h-12 w-full">{submitting ? "Bezig…" : stage !== "verified" ? "Verifieer eerst je e-mail" : !adult || !terms || !dataConsent ? "Bevestig veiligheid en toestemming" : "Account maken"}</Button><div className="pb-[max(24px,env(safe-area-inset-bottom))] text-center text-sm text-white/50">Heb je al een account? <Link className="font-semibold text-white underline" href="/login">Log in</Link></div>
    </form>
  </div></main>;
}
