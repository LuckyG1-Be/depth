"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Prefs = {
  genders: string[];
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;

  // premium-ready (UI only for now)
  intentFilter?: string | null;
  religionFilter?: string | null;
  valuesFilter?: string[];

  // ✅ NEW
  verifiedOnly?: boolean;
};

const GENDER_VALUES = ["Vrouw", "Man"] as const; // storage values

function labelForGenderValue(v: string) {
  if (v === "Man") return "Mannen";
  if (v === "Vrouw") return "Vrouwen";
  return v;
}

async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || "Laden mislukt");
  return data;
}

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || "Opslaan mislukt");
  return data;
}

export default function DatingPreferencesForm({
  variant = "page",
  onClose,
}: {
  variant?: "page" | "modal";
  onClose?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const [genders, setGenders] = useState<string[]>(["Vrouw", "Man"]);
  const [minAge, setMinAge] = useState<number>(20);
  const [maxAge, setMaxAge] = useState<number>(35);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(50);

  // premium-ready (UI-only)
  const [intentFilter, setIntentFilter] = useState<string>("");
  const [religionFilter, setReligionFilter] = useState<string>("");
  const [valuesFilter, setValuesFilter] = useState<string[]>([]);

  // ✅ NEW
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  const lastSentRef = useRef<string>("");
  const didInitSentRef = useRef(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data: any = await getJson("/api/preferences/get");
      const p: Prefs = data.preferences;

      const g = Array.isArray(p.genders) ? p.genders.filter((x) => GENDER_VALUES.includes(x as any)) : [];
      setGenders(g.length ? g : ["Vrouw", "Man"]);

      setMinAge(typeof p.minAge === "number" ? p.minAge : 20);
      setMaxAge(typeof p.maxAge === "number" ? p.maxAge : 35);
      setMaxDistanceKm(typeof p.maxDistanceKm === "number" ? p.maxDistanceKm : 50);

      setIntentFilter(p.intentFilter ? String(p.intentFilter) : "");
      setReligionFilter(p.religionFilter ? String(p.religionFilter) : "");
      setValuesFilter(Array.isArray(p.valuesFilter) ? p.valuesFilter.map(String) : []);

      setVerifiedOnly(!!p.verifiedOnly);
    } catch (e: any) {
      setError(e?.message || "Fout bij laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const everyone = genders.length === 2;

  const canSave = useMemo(() => {
    if (genders.length === 0) return false;
    if (minAge < 18 || maxAge > 99) return false;
    if (minAge > maxAge) return false;
    if (maxDistanceKm < 1 || maxDistanceKm > 500) return false;
    return true;
  }, [genders, minAge, maxAge, maxDistanceKm]);

  async function save(next?: Partial<Prefs>) {
    const payload: Prefs = {
      genders: next?.genders ?? genders,
      minAge: next?.minAge ?? minAge,
      maxAge: next?.maxAge ?? maxAge,
      maxDistanceKm: next?.maxDistanceKm ?? maxDistanceKm,

      intentFilter: next?.intentFilter ?? intentFilter,
      religionFilter: next?.religionFilter ?? religionFilter,
      valuesFilter: next?.valuesFilter ?? valuesFilter,

      verifiedOnly: next?.verifiedOnly ?? verifiedOnly,
    };

    const key = JSON.stringify(payload);

    // Vermijd een "autosave" direct na load, tenzij user effectief iets wijzigt
    if (!didInitSentRef.current) {
      lastSentRef.current = key;
      didInitSentRef.current = true;
      return;
    }

    if (key === lastSentRef.current) return;
    if (!canSave) return;

    setSaving(true);
    setStatus("saving");
    setError(null);

    try {
      await postJson("/api/preferences/update", { preferences: payload });
      lastSentRef.current = key;

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);

      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Opslaan mislukt");
      setStatus("idle");
    } finally {
      setSaving(false);
    }
  }

  // ✅ Autosave nu voor BOTH modal én page (geen Opslaan-knop meer)
  const autosave = true;

  useEffect(() => {
    if (!autosave) return;
    if (loading) return;
    if (!canSave) return;

    const t = setTimeout(() => {
      void save();
    }, 650);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autosave,
    loading,
    canSave,
    genders.join("|"),
    minAge,
    maxAge,
    maxDistanceKm,
    intentFilter,
    religionFilter,
    valuesFilter.join("|"),
    verifiedOnly,
  ]);

  function toggleGender(v: "Vrouw" | "Man") {
    setGenders((prev) => {
      const has = prev.includes(v);
      const next = has ? prev.filter((x) => x !== v) : [...prev, v];
      return next.length ? next : prev; // never allow empty
    });
  }

  function resetPreferences() {
    const next = { genders: ["Vrouw", "Man"], minAge: 20, maxAge: 35, maxDistanceKm: 50, intentFilter: "", religionFilter: "", valuesFilter: [], verifiedOnly: false };
    setGenders(next.genders); setMinAge(next.minAge); setMaxAge(next.maxAge); setMaxDistanceKm(next.maxDistanceKm); setIntentFilter(""); setReligionFilter(""); setValuesFilter([]); setVerifiedOnly(false);
    void save(next);
  }

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm opacity-70">Laden…</div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm">{error}</div>}

      {/* Status */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm opacity-70">{status === "saving" ? "Opslaan…" : status === "saved" ? "Opgeslagen ✓" : ""}</div>
        <button type="button" onClick={resetPreferences} disabled={saving} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50">Reset voorkeuren</button>

        {variant === "modal" && onClose ? <button type="button" onClick={onClose} className="sr-only" aria-label="Sluiten" /> : null}
      </div>

      <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4 text-sm text-emerald-50/85">Je ziet profielen tussen <b>{minAge} en {maxAge}</b> jaar binnen ongeveer <b>{maxDistanceKm} km</b>. Je voorkeuren worden automatisch opgeslagen.</div>

      {/* Verified filter */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Geverifieerd</div>
            <div className="mt-1 text-sm opacity-70">Filter Discover op profielen met een blauwe check.</div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => setVerifiedOnly((v) => !v)}
            className={cls(
              "relative inline-flex h-8 w-14 items-center rounded-full border transition disabled:opacity-60",
              verifiedOnly ? "border-emerald-300/35 bg-emerald-400/15" : "border-white/10 bg-black/20"
            )}
            aria-label="Alleen geverifieerde profielen"
          >
            <span
              className={cls(
                "inline-block h-6 w-6 transform rounded-full bg-white/90 transition",
                verifiedOnly ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div className="mt-3 text-sm">
          <span className="opacity-70">Modus: </span>
          <span className="font-semibold">{verifiedOnly ? "Alleen geverifieerde profielen" : "Alles tonen"}</span>
        </div>
      </section>

      {/* Genders */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Toon profielen van</div>
            <div className="mt-1 text-sm opacity-70">Kies één of beide.</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold">
            {everyone ? "Iedereen" : genders.map(labelForGenderValue).join(" & ")}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {GENDER_VALUES.map((v) => {
            const on = genders.includes(v);
            const label = labelForGenderValue(v);

            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleGender(v)}
                disabled={saving}
                className={cls(
                  "rounded-full border px-4 py-2 text-sm transition disabled:opacity-60",
                  on ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-50" : "border-white/10 bg-black/10 hover:bg-white/10"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Leeftijd */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Leeftijd</div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold">
            {minAge} – {maxAge}
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <div className="text-sm font-semibold opacity-80">Minimum</div>
            <input
              type="range"
              min={18}
              max={99}
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value))}
              className="mt-2 w-full"
              disabled={saving}
            />
          </div>

          <div>
            <div className="text-sm font-semibold opacity-80">Maximum</div>
            <input
              type="range"
              min={18}
              max={99}
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              className="mt-2 w-full"
              disabled={saving}
            />
          </div>
        </div>
      </section>

      {/* Afstand */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Afstand</div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold">
            {maxDistanceKm} km
          </div>
        </div>

        <div className="mt-4">
          <input
            type="range"
            min={1}
            max={500}
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            className="w-full"
            disabled={saving}
          />
        </div>

        <div className="mt-2 text-sm opacity-70">Tip: 15–35 km voelt vaak het beste voor “in de buurt”.</div>
      </section>
    </div>
  );
}
