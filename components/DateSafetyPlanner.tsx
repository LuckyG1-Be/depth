"use client";

import { useEffect, useState } from "react";

type Plan = { place: string; date: string; trustedContact: string; checkedIn: boolean };

const EMPTY: Plan = { place: "", date: "", trustedContact: "", checkedIn: false };

export default function DateSafetyPlanner({ otherName }: { otherName: string }) {
  const key = `depth:date-safety:${otherName}`;
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<Plan>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(key);
      if (value) setPlan({ ...EMPTY, ...JSON.parse(value) });
    } catch {}
  }, [key]);

  function save() {
    try { window.localStorage.setItem(key, JSON.stringify(plan)); } catch {}
    setSaved(true);
    setOpen(false);
  }

  async function share() {
    const text = `Mijn Depth-afspraak met ${otherName}${plan.place ? ` bij ${plan.place}` : ""}${plan.date ? ` op ${plan.date}` : ""}. Ik laat je weten wanneer ik veilig thuis ben.`;
    if (navigator.share) await navigator.share({ title: "Mijn afspraak", text }).catch(() => null);
    else await navigator.clipboard?.writeText(text);
  }

  return (
    <section className="mt-6 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div><div className="text-sm font-semibold text-emerald-50">Date Safety</div><p className="mt-1 text-xs leading-5 text-emerald-50/70">Bewaar een plan op je eigen toestel. Depth deelt je afspraak niet met de andere persoon.</p></div>
        <span className="rounded-full border border-emerald-100/20 px-2 py-1 text-[10px] text-emerald-100">Privé</span>
      </div>
      {saved ? <div className="mt-4 rounded-2xl border border-emerald-100/15 bg-black/10 p-3 text-sm text-emerald-50">Plan opgeslagen op dit toestel. Deel het met iemand die je vertrouwt.</div> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-emerald-200 px-3 py-2 text-xs font-semibold text-black">{saved ? "Plan aanpassen" : "Plan maken"}</button>
        {saved ? <button type="button" onClick={() => void share()} className="rounded-xl border border-emerald-100/20 bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-50">Delen met vertrouwd contact</button> : null}
      </div>
      {open ? <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4">
        <label className="grid gap-1 text-xs text-white/70">Plaats of publieke locatie<input value={plan.place} onChange={(e) => setPlan((p) => ({ ...p, place: e.target.value }))} placeholder="Bijv. café in het centrum" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" /></label>
        <label className="grid gap-1 text-xs text-white/70">Datum en tijd<input type="datetime-local" value={plan.date} onChange={(e) => setPlan((p) => ({ ...p, date: e.target.value }))} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" /></label>
        <label className="grid gap-1 text-xs text-white/70">Naam van vertrouwd contact<input value={plan.trustedContact} onChange={(e) => setPlan((p) => ({ ...p, trustedContact: e.target.value }))} placeholder="Optioneel" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" /></label>
        <div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-3 py-2 text-xs">Annuleren</button><button type="button" onClick={save} className="rounded-xl bg-emerald-200 px-3 py-2 text-xs font-semibold text-black">Opslaan</button></div>
      </div> : null}
    </section>
  );
}
