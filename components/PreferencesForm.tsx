"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePremium } from "@/components/premium/PremiumProvider";
import { useToast } from "@/components/ToastProvider";
import { getJson, postJson } from "@/components/preferences/PreferencesApi";
import {
  GENDER_VALUES,
  isGenderValue,
  type PreferencesVariant,
  type Prefs,
} from "@/components/preferences/PreferencesTypes";
import { PreferencesFormSections, PreferencesLoadingState } from "@/components/preferences/PreferencesSections";

const DEFAULT_PREFS: Prefs = {
  genders: ["Vrouw", "Man"],
  minAge: 20,
  maxAge: 35,
  maxDistanceKm: 50,
  intentFilter: "",
  religionFilter: "",
  valuesFilter: [],
  educationFilter: "",
  drinkingFilter: "",
  smokingFilter: "",
  exerciseFilter: "",
  lifestyleFiltersUntil: null,
};

function normalizePrefs(raw: Partial<Prefs> | null | undefined): Prefs {
  const p = raw ?? {};
  const genders = Array.isArray(p.genders) ? p.genders.filter(isGenderValue) : [];

  return {
    genders: genders.length ? genders : [...GENDER_VALUES],
    minAge: typeof p.minAge === "number" ? p.minAge : DEFAULT_PREFS.minAge,
    maxAge: typeof p.maxAge === "number" ? p.maxAge : DEFAULT_PREFS.maxAge,
    maxDistanceKm: typeof p.maxDistanceKm === "number" ? p.maxDistanceKm : DEFAULT_PREFS.maxDistanceKm,
    intentFilter: p.intentFilter ? String(p.intentFilter) : "",
    religionFilter: p.religionFilter ? String(p.religionFilter) : "",
    valuesFilter: Array.isArray(p.valuesFilter) ? p.valuesFilter.map(String) : [],
    educationFilter: p.educationFilter ? String(p.educationFilter) : "",
    drinkingFilter: p.drinkingFilter ? String(p.drinkingFilter) : "",
    smokingFilter: p.smokingFilter ? String(p.smokingFilter) : "",
    exerciseFilter: p.exerciseFilter ? String(p.exerciseFilter) : "",
    lifestyleFiltersUntil: p.lifestyleFiltersUntil ? String(p.lifestyleFiltersUntil) : null,
  };
}

function canPersistPrefs(prefs: Prefs) {
  if (prefs.genders.length === 0) return false;
  if (prefs.minAge < 18 || prefs.maxAge > 65) return false;
  if (prefs.minAge > prefs.maxAge) return false;
  if (prefs.maxDistanceKm < 1 || prefs.maxDistanceKm > 500) return false;
  return true;
}

export default function DatingPreferencesForm({
  variant = "page",
  onClose,
}: {
  variant?: PreferencesVariant;
  onClose?: () => void;
}) {
  const router = useRouter();
  const { openUpgrade, refresh: refreshPremium } = usePremium();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const [genders, setGenders] = useState<string[]>(DEFAULT_PREFS.genders);
  const [minAge, setMinAge] = useState<number>(DEFAULT_PREFS.minAge);
  const [maxAge, setMaxAge] = useState<number>(DEFAULT_PREFS.maxAge);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(DEFAULT_PREFS.maxDistanceKm);

  const [intentFilter, setIntentFilter] = useState<string>("");
  const [religionFilter, setReligionFilter] = useState<string>("");
  const [valuesFilter, setValuesFilter] = useState<string[]>([]);
  const [educationFilter, setEducationFilter] = useState<string>("");
  const [drinkingFilter, setDrinkingFilter] = useState<string>("");
  const [smokingFilter, setSmokingFilter] = useState<string>("");
  const [exerciseFilter, setExerciseFilter] = useState<string>("");
  const [lifestyleFiltersUntil, setLifestyleFiltersUntil] = useState<string | null>(null);
  const [unlockingLifestyle, setUnlockingLifestyle] = useState(false);

  const lastSentRef = useRef<string>("");
  const latestPrefsRef = useRef<Prefs>(DEFAULT_PREFS);
  const saveInFlightRef = useRef(false);
  const queuedPrefsRef = useRef<Prefs | null>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const everyone = genders.length === 2;
  const lifestyleFiltersActive =
    !!lifestyleFiltersUntil && new Date(lifestyleFiltersUntil).getTime() > Date.now();

  const canSave = useMemo(
    () => canPersistPrefs({ ...DEFAULT_PREFS, genders, minAge, maxAge, maxDistanceKm }),
    [genders, minAge, maxAge, maxDistanceKm],
  );

  const payload = useMemo<Prefs>(
    () => ({
      genders,
      minAge,
      maxAge,
      maxDistanceKm,
      intentFilter,
      religionFilter,
      valuesFilter,
      educationFilter,
      drinkingFilter,
      smokingFilter,
      exerciseFilter,
      lifestyleFiltersUntil,
    }),
    [
      genders,
      minAge,
      maxAge,
      maxDistanceKm,
      intentFilter,
      religionFilter,
      valuesFilter,
      educationFilter,
      drinkingFilter,
      smokingFilter,
      exerciseFilter,
      lifestyleFiltersUntil,
    ]
  );

  useEffect(() => {
    latestPrefsRef.current = payload;
  }, [payload]);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (loading || !canSave) return;

    const next = payload;
    const key = JSON.stringify(next);
    if (key === lastSentRef.current) return;

    const timer = setTimeout(() => requestSave(next), 450);
    return () => clearTimeout(timer);
  }, [loading, canSave, payload]);

  useEffect(() => {
    return () => {
      try {
        const cur = latestPrefsRef.current;
        const key = JSON.stringify(cur);
        if (!canSave) return;
        if (!key || key === lastSentRef.current) return;

        void postJson("/api/preferences/update", { preferences: cur }, { keepalive: true }).then(() => {
          lastSentRef.current = key;
        });
      } catch {
        // ignore best-effort keepalive save
      }
    };
  }, [canSave]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data: { preferences?: Partial<Prefs> } = await getJson("/api/preferences/get");
      const nextPrefs = normalizePrefs(data.preferences);

      applyPrefsToState(nextPrefs);
      lastSentRef.current = JSON.stringify(nextPrefs);
      latestPrefsRef.current = nextPrefs;
      queuedPrefsRef.current = null;
    } catch (e: any) {
      setError(e?.message || "Fout bij laden");
    } finally {
      setLoading(false);
    }
  }

  function applyPrefsToState(nextPrefs: Prefs) {
    setGenders(nextPrefs.genders);
    setMinAge(nextPrefs.minAge);
    setMaxAge(nextPrefs.maxAge);
    setMaxDistanceKm(nextPrefs.maxDistanceKm);
    setIntentFilter(nextPrefs.intentFilter ? String(nextPrefs.intentFilter) : "");
    setReligionFilter(nextPrefs.religionFilter ? String(nextPrefs.religionFilter) : "");
    setValuesFilter(Array.isArray(nextPrefs.valuesFilter) ? nextPrefs.valuesFilter : []);
    setEducationFilter(nextPrefs.educationFilter ? String(nextPrefs.educationFilter) : "");
    setDrinkingFilter(nextPrefs.drinkingFilter ? String(nextPrefs.drinkingFilter) : "");
    setSmokingFilter(nextPrefs.smokingFilter ? String(nextPrefs.smokingFilter) : "");
    setExerciseFilter(nextPrefs.exerciseFilter ? String(nextPrefs.exerciseFilter) : "");
    setLifestyleFiltersUntil(nextPrefs.lifestyleFiltersUntil ? String(nextPrefs.lifestyleFiltersUntil) : null);
  }

  async function persistPrefs(nextPrefs: Prefs, opts?: { keepalive?: boolean; refresh?: boolean }) {
    const key = JSON.stringify(nextPrefs);
    if (key === lastSentRef.current || !canPersistPrefs(nextPrefs)) return;

    setSaving(true);
    setStatus("saving");
    setError(null);

    const data: { preferences?: Partial<Prefs> } = await postJson("/api/preferences/update", { preferences: nextPrefs }, { keepalive: opts?.keepalive });
    const savedPrefs = data.preferences ? normalizePrefs(data.preferences) : nextPrefs;
    const savedKey = JSON.stringify(savedPrefs);

    lastSentRef.current = savedKey;
    latestPrefsRef.current = savedPrefs;
    setStatus("saved");
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => setStatus("idle"), 1200);

    if (!queuedPrefsRef.current && savedKey !== key) applyPrefsToState(savedPrefs);
    if (opts?.refresh) router.refresh();
  }

  async function flushQueuedSaves() {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;

    try {
      while (queuedPrefsRef.current) {
        const next = queuedPrefsRef.current;
        queuedPrefsRef.current = null;
        await persistPrefs(next);
      }
    } catch (e: any) {
      setError(e?.message || "Opslaan mislukt");
      setStatus("idle");
    } finally {
      setSaving(false);
      saveInFlightRef.current = false;
      if (queuedPrefsRef.current) void flushQueuedSaves();
    }
  }

  function requestSave(nextPrefs: Prefs) {
    latestPrefsRef.current = nextPrefs;
    queuedPrefsRef.current = nextPrefs;
    void flushQueuedSaves();
  }

  function toggleGender(value: "Vrouw" | "Man") {
    setGenders((prev) => {
      const next = prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value];
      return next.length ? next : prev;
    });
  }

  async function unlockLifestyleFilters() {
    setUnlockingLifestyle(true);
    setError(null);

    try {
      const data = await postJson("/api/preferences/lifestyle/unlock", {});
      const activeUntil = data?.activeUntil ? String(data.activeUntil) : null;
      if (activeUntil) setLifestyleFiltersUntil(activeUntil);

      const merged: Prefs = {
        ...latestPrefsRef.current,
        lifestyleFiltersUntil: activeUntil ?? latestPrefsRef.current.lifestyleFiltersUntil ?? null,
      };

      latestPrefsRef.current = merged;
      queuedPrefsRef.current = null;
      lastSentRef.current = JSON.stringify(merged);

      setStatus("saved");
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setStatus("idle"), 1200);

      window.dispatchEvent(new Event("depth:wallet-changed"));
      await refreshPremium().catch(() => null);
      toast({ kind: "success", title: "Filters actief", message: "Premium compatibiliteitsfilters zijn 4 weken actief." });
      router.refresh();
    } catch (e: any) {
      const message = String(e?.message || "Ontgrendelen mislukt");
      if (message === "INSUFFICIENT_TOKENS" || message.toLowerCase().includes("onvoldoende")) {
        setError(null);
        openUpgrade("Premium compatibiliteitsfilters");
      } else {
        setError(message);
      }
    } finally {
      setUnlockingLifestyle(false);
    }
  }

  if (loading) return <PreferencesLoadingState />;

  return (
    <PreferencesFormSections
      error={error}
      status={status}
      variant={variant}
      onClose={onClose}
      saving={saving}
      genders={genders}
      everyone={everyone}
      onToggleGender={toggleGender}
      minAge={minAge}
      maxAge={maxAge}
      setMinAge={setMinAge}
      setMaxAge={setMaxAge}
      maxDistanceKm={maxDistanceKm}
      setMaxDistanceKm={setMaxDistanceKm}
      lifestyleFiltersActive={lifestyleFiltersActive}
      lifestyleFiltersUntil={lifestyleFiltersUntil}
      unlockingLifestyle={unlockingLifestyle}
      onUnlockLifestyle={() => void unlockLifestyleFilters()}
      educationFilter={educationFilter}
      drinkingFilter={drinkingFilter}
      smokingFilter={smokingFilter}
      exerciseFilter={exerciseFilter}
      setEducationFilter={setEducationFilter}
      setDrinkingFilter={setDrinkingFilter}
      setSmokingFilter={setSmokingFilter}
      setExerciseFilter={setExerciseFilter}
    />
  );
}
