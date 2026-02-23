"use client";

import { useMemo, useState } from "react";
import { PROFILE_QUESTIONS } from "@/lib/profileQuestions";
import LocationAutocomplete, { type LocationValue } from "@/components/LocationAutocomplete";

type Initial = {
  name: string;
  city: string;
  gender: string;
  lookingFor: string;
  intent: string;
  religion: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  values: string;
  passions: string;
  minAge: number;
  maxAge: number;

  // 👇 nieuw (mag leeg zijn voor oude users)
  lat?: number | null;
  lng?: number | null;
  placeId?: string | null;
};

function trim(x: string) {
  return (x || "").trim();
}

function isComplete(s: { intent: string; religion: string; q1: string; q2: string; q3: string; q4: string; q5: string }) {
  return (
    trim(s.intent).length > 0 &&
    trim(s.religion).length > 0 &&
    trim(s.q1).length > 0 &&
    trim(s.q2).length > 0 &&
    trim(s.q3).length > 0 &&
    trim(s.q4).length > 0 &&
    trim(s.q5).length > 0
  );
}

export default function ProfileForm({ initial, requireComplete }: { initial: Initial; requireComplete: boolean }) {
  const [name, setName] = useState(initial.name);
  const [gender, setGender] = useState(initial.gender || "Man");
  const [lookingFor, setLookingFor] = useState(initial.lookingFor || "Vrouw");

  // 👇 locatie state: we bewaren zowel label (city) als lat/lng/placeId
  const [location, setLocation] = useState<LocationValue | null>(() => {
    const city = (initial.city || "").trim();
    const placeId = (initial.placeId || "").trim();
    const lat = initial.lat ?? null;
    const lng = initial.lng ?? null;

    if (city && placeId && typeof lat === "number" && typeof lng === "number") {
      return { label: city, placeId, lat, lng };
    }
    return null;
  });

  const [intent, setIntent] = useState(initial.intent);
  const [religion, setReligion] = useState(initial.religion);

  const [q1, setQ1] = useState(initial.q1);
  const [q2, setQ2] = useState(initial.q2);
  const [q3, setQ3] = useState(initial.q3);
  const [q4, setQ4] = useState(initial.q4);
  const [q5, setQ5] = useState(initial.q5);

  const [minAge, setMinAge] = useState<number>(initial.minAge ?? 18);
  const [maxAge, setMaxAge] = useState<number>(initial.maxAge ?? 99);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const intentOptions = useMemo(() => ["Relatie", "Iets serieus", "Open", "Vriendschap"], []);
  const religionOptions = useMemo(() => ["Geen", "Christelijk", "Islam", "Joods", "Hindoe", "Boeddhist", "Anders"], []);

  const completeNow = isComplete({ intent, religion, q1, q2, q3, q4, q5 });

  async function onSave() {
    setError(null);
    setOkMsg(null);

    if (!completeNow) {
      setError("Vul intentie, religie én alle 5 vragen in.");
      return;
    }

    // ✅ locatie verplicht voor correcte distance
    if (!location) {
      setError("Kies je stad uit de lijst (autocomplete). Vrije tekst is niet toegestaan.");
      return;
    }

    if (minAge < 18 || maxAge > 99 || minAge > maxAge) {
      setError("Leeftijdsrange is ongeldig (min 18, max 99, min ≤ max).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          city: location.label,
          lat: location.lat,
          lng: location.lng,
          placeId: location.placeId,
          gender,
          lookingFor,
          intent,
          religion,
          q1,
          q2,
          q3,
          q4,
          q5,
          minAge,
          maxAge,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.error || "Opslaan mislukt.");
        return;
      }

      setOkMsg("Opgeslagen ✅");
      // je huidige API geeft geen "complete" terug, dus we laten navigatie aan jou.
      // (Als jij later autosave maakt, halen we deze knop weg.)
    } catch (e: any) {
      setError(e?.message || "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {requireComplete && (
        <div className="rounded-2xl border border-amber-900 bg-amber-950 px-4 py-3 text-amber-200">
          <div className="font-semibold">Actie vereist</div>
          <div className="text-sm">Vul je intentie, religie en 5 vragen in voordat je kan swipen.</div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-50">Profiel compleetheid</div>
            <div className="text-xs text-zinc-400">
              {completeNow ? "Compleet ✅ (swipen toegestaan)" : "Niet compleet ❌ (swipen geblokkeerd)"}
            </div>
          </div>

          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              completeNow
                ? "border border-green-900 bg-green-950 text-green-200"
                : "border border-red-900 bg-red-950 text-red-200"
            }`}
          >
            {completeNow ? "100%" : "Onvolledig"}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-400">Voornaam</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400">Stad (kies uit lijst)</label>
              <LocationAutocomplete value={location} onChange={setLocation} />
              <div className="mt-1 text-[11px] text-zinc-500">
                Tip: kies een suggestie — zo werkt afstand & filtering correct.
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400">Geslacht</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
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
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              >
                <option value="Man">Man</option>
                <option value="Vrouw">Vrouw</option>
                <option value="X">X</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-400">
                Intentie <span className="text-red-300">*</span>
              </label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              >
                <option value="">Kies...</option>
                {intentOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400">
                Religie <span className="text-red-300">*</span>
              </label>
              <select
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              >
                <option value="">Kies...</option>
                {religionOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="text-xs text-zinc-400">
              5 vragen <span className="text-red-300">*</span>
            </div>

            <div>
              <label className="block text-sm text-zinc-100">{PROFILE_QUESTIONS[0]}</label>
              <input
                value={q1}
                onChange={(e) => setQ1(e.target.value)}
                placeholder={PROFILE_QUESTIONS[0]}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-100">{PROFILE_QUESTIONS[1]}</label>
              <input
                value={q2}
                onChange={(e) => setQ2(e.target.value)}
                placeholder={PROFILE_QUESTIONS[1]}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-100">{PROFILE_QUESTIONS[2]}</label>
              <input
                value={q3}
                onChange={(e) => setQ3(e.target.value)}
                placeholder={PROFILE_QUESTIONS[2]}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-100">{PROFILE_QUESTIONS[3]}</label>
              <input
                value={q4}
                onChange={(e) => setQ4(e.target.value)}
                placeholder={PROFILE_QUESTIONS[3]}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-100">{PROFILE_QUESTIONS[4]}</label>
              <input
                value={q5}
                onChange={(e) => setQ5(e.target.value)}
                placeholder={PROFILE_QUESTIONS[4]}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400">Min leeftijd</label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                min={18}
                max={99}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Max leeftijd</label>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                min={18}
                max={99}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">{error}</div>}
          {okMsg && <div className="rounded-xl border border-green-900 bg-green-950 px-3 py-2 text-sm text-green-200">{okMsg}</div>}

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="mt-2 w-full rounded-2xl bg-white px-4 py-3 font-medium text-zinc-900 disabled:opacity-60"
          >
            {saving ? "Opslaan..." : "Opslaan & verder"}
          </button>
        </div>
      </div>
    </div>
  );
}