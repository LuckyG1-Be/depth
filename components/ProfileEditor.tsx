"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProfilePhotoManager, { type ProfilePhoto } from "@/components/ProfilePhotoManager";
import { VALUES, PASSIONS } from "@/lib/profileOptions";

type Props = {
  initial: {
    user: {
      name: string;
      city: string;
      gender: string;
      lookingFor: string;
    };
    profile: {
      intent: string;
      religion: string;
      values: string[];
      passions: string[];
      q1: string;
      q2: string;
      q3: string;
      q4: string;
      q5: string;
    };
    photos: ProfilePhoto[];
  };
};

const INTENTS = ["Serieuze relatie", "Casual", "Vriendschap", "Nog aan het kijken"];
const RELIGIONS = ["Geen", "Christelijk", "Islam", "Joods", "Hindoe", "Boeddhist", "Anders"];

const GENDER_OPTIONS = ["Vrouw", "Man", "Non-binair"];
const LOOKING_FOR_OPTIONS = ["Vrouw", "Man", "Iedereen"];

const REQUIRED_VALUES = 3;
const REQUIRED_PASSIONS = 4;

const MIN_PHOTOS = 4;
const DEPTH_MIN_CHARS = 25;

const PROFILE_QUESTIONS: Array<{ key: "q1" | "q2" | "q3" | "q4" | "q5"; label: string }> = [
  { key: "q1", label: "Wat is voor jou een perfecte zaterdag?" },
  { key: "q2", label: "Wat waardeer jij het meest in een relatie?" },
  { key: "q3", label: "Waar kijk je het meest naar uit dit jaar?" },
  { key: "q4", label: "Wat is een kleine gewoonte die je leven beter maakt?" },
  { key: "q5", label: "Wat wil je dat iemand over jou begrijpt vanaf het begin?" },
];

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
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

function useDebouncedEffect(effect: () => void, deps: any[], delayMs: number) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => effect(), delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function ProfileEditor({ initial }: Props) {
  const [user, setUser] = useState(initial.user);
  const [profile, setProfile] = useState(initial.profile);
  const [photos, setPhotos] = useState<ProfilePhoto[]>(initial.photos);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [globalError, setGlobalError] = useState<string | null>(null);

  const lastUserSentRef = useRef<string>("");
  const lastProfileSentRef = useRef<string>("");

  const photoCount = photos.length;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!user.name.trim()) e.name = "Naam is verplicht.";
    if (!user.city.trim()) e.city = "Stad is verplicht.";
    if (!user.gender.trim()) e.gender = "Gender is verplicht.";
    if (!user.lookingFor.trim()) e.lookingFor = "Kies wie je wil zien.";

    if (!profile.intent.trim()) e.intent = "Kies een intentie.";

    if (profile.values.length !== REQUIRED_VALUES) e.values = `Selecteer exact ${REQUIRED_VALUES} waarden.`;
    if (profile.passions.length !== REQUIRED_PASSIONS) e.passions = `Selecteer exact ${REQUIRED_PASSIONS} passies.`;

    for (const q of PROFILE_QUESTIONS) {
      const t = (profile[q.key] || "").trim();
      if (!t) e[q.key] = "Verplicht.";
      else if (t.length < DEPTH_MIN_CHARS) e[q.key] = `Min. ${DEPTH_MIN_CHARS} tekens.`;
    }

    if (photoCount < MIN_PHOTOS) e.photos = `Upload min. ${MIN_PHOTOS} foto’s.`;
    return e;
  }, [photoCount, profile, user]);

  function togglePick(list: string[], item: string, max: number) {
    const has = list.includes(item);
    if (has) return list.filter((x) => x !== item);
    if (list.length >= max) return list;
    return [...list, item];
  }

  async function refreshMe() {
    const res = await fetch("/api/profile/me", { method: "GET" });
    const data: any = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error(data?.error || "Kon profiel niet herladen");

    if (Array.isArray(data.photos)) {
      const normalized: ProfilePhoto[] = data.photos
        .map((p: any) => ({
          id: String(p.id),
          slot: Number(p.slot),
          url: p.url ? String(p.url) : `/api/photo/${p.id}`,
        }))
        .filter((p: ProfilePhoto) => Number.isFinite(p.slot))
        .sort((a: ProfilePhoto, b: ProfilePhoto) => a.slot - b.slot);

      setPhotos(normalized);
    }
  }

  async function saveUser(partial: Partial<Props["initial"]["user"]>) {
    setGlobalError(null);
    const payload = JSON.stringify(partial);
    if (payload === lastUserSentRef.current) return;

    setSaveStatus("saving");
    try {
      await postJson("/api/profile/update-user", { user: partial });
      lastUserSentRef.current = payload;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1200);
    } catch (e: any) {
      setGlobalError(e?.message || "Opslaan mislukt");
      setSaveStatus("idle");
    }
  }

  async function saveProfile(partial: Partial<Props["initial"]["profile"]>) {
    setGlobalError(null);
    const payload = JSON.stringify(partial);
    if (payload === lastProfileSentRef.current) return;

    setSaveStatus("saving");
    try {
      await postJson("/api/profile/update-profile", { profile: partial });
      lastProfileSentRef.current = payload;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1200);
    } catch (e: any) {
      setGlobalError(e?.message || "Opslaan mislukt");
      setSaveStatus("idle");
    }
  }

  // autosave user
  useDebouncedEffect(() => {
    if (!user.name.trim() || !user.city.trim() || !user.gender.trim() || !user.lookingFor.trim()) return;
    void saveUser({
      name: user.name,
      city: user.city,
      gender: user.gender,
      lookingFor: user.lookingFor,
    });
  }, [user.name, user.city, user.gender, user.lookingFor], 850);

  // autosave profile
  useDebouncedEffect(() => {
    if (!profile.intent.trim()) return;
    void saveProfile({
      intent: profile.intent,
      religion: profile.religion,
      values: profile.values,
      passions: profile.passions,
      q1: profile.q1,
      q2: profile.q2,
      q3: profile.q3,
      q4: profile.q4,
      q5: profile.q5,
    });
  }, [
    profile.intent,
    profile.religion,
    profile.values.join("|"),
    profile.passions.join("|"),
    profile.q1,
    profile.q2,
    profile.q3,
    profile.q4,
    profile.q5,
  ], 1050);

  const labelBase = "grid gap-2 text-sm";
  const inputBase =
    "rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30";
  const textareaBase =
    "min-h-[110px] rounded-2xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30";

  return (
    <div className="space-y-8">
      {globalError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm">{globalError}</div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs opacity-70">
          {saveStatus === "saving" ? "Opslaan…" : saveStatus === "saved" ? "Opgeslagen ✓" : ""}
        </div>
        <Link
          href="/profile/preferences"
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm hover:bg-white/10"
        >
          Datingvoorkeuren
        </Link>
      </div>

      {/* Basis */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Basis</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className={labelBase}>
            <span className="opacity-80">Naam</span>
            <input value={user.name} onChange={(e) => setUser((s) => ({ ...s, name: e.target.value }))} className={inputBase} />
            {errors.name && <div className="text-xs text-red-300">{errors.name}</div>}
          </label>

          <label className={labelBase}>
            <span className="opacity-80">Stad</span>
            <input value={user.city} onChange={(e) => setUser((s) => ({ ...s, city: e.target.value }))} className={inputBase} />
            {errors.city && <div className="text-xs text-red-300">{errors.city}</div>}
          </label>

          <label className={labelBase}>
            <span className="opacity-80">Gender</span>
            <select value={user.gender} onChange={(e) => setUser((s) => ({ ...s, gender: e.target.value }))} className={inputBase}>
              <option value="">Kies…</option>
              {GENDER_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            {errors.gender && <div className="text-xs text-red-300">{errors.gender}</div>}
          </label>

          <label className={labelBase}>
            <span className="opacity-80">Ik zoek</span>
            <select
              value={user.lookingFor}
              onChange={(e) => setUser((s) => ({ ...s, lookingFor: e.target.value }))}
              className={inputBase}
            >
              <option value="">Kies…</option>
              {LOOKING_FOR_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            {errors.lookingFor && <div className="text-xs text-red-300">{errors.lookingFor}</div>}
          </label>

          <label className={cls(labelBase, "sm:col-span-2")}>
            <span className="opacity-80">Intentie</span>
            <select
              value={profile.intent}
              onChange={(e) => setProfile((s) => ({ ...s, intent: e.target.value }))}
              className={inputBase}
            >
              <option value="">Kies…</option>
              {INTENTS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            {errors.intent && <div className="text-xs text-red-300">{errors.intent}</div>}
          </label>

          <label className={cls(labelBase, "sm:col-span-2")}>
            <span className="opacity-80">Religie</span>
            <select
              value={profile.religion}
              onChange={(e) => setProfile((s) => ({ ...s, religion: e.target.value }))}
              className={inputBase}
            >
              <option value="">Kies…</option>
              {RELIGIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Waarden & passies */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Waarden & passies</h2>
        <div className="mt-2 text-sm opacity-75">
          Kies exact <b>{REQUIRED_VALUES}</b> waarden en <b>{REQUIRED_PASSIONS}</b> passies.
        </div>

        <div className="mt-5 grid gap-6">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Waarden</div>
              <div className={cls("text-xs", errors.values ? "text-red-300" : "opacity-70")}>
                {profile.values.length}/{REQUIRED_VALUES}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {VALUES.map((v) => {
                const on = profile.values.includes(v);
                const disabled = !on && profile.values.length >= REQUIRED_VALUES;
                return (
                  <button
                    key={v}
                    type="button"
                    disabled={disabled}
                    onClick={() => setProfile((s) => ({ ...s, values: togglePick(s.values, v, REQUIRED_VALUES) }))}
                    className={cls(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      on
                        ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-50"
                        : "border-white/10 bg-black/10 hover:bg-white/10",
                      disabled && "opacity-40"
                    )}
                  >
                    {v}
                  </button>
                );
              })}
            </div>

            {errors.values && <div className="mt-2 text-xs text-red-300">{errors.values}</div>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Passies</div>
              <div className={cls("text-xs", errors.passions ? "text-red-300" : "opacity-70")}>
                {profile.passions.length}/{REQUIRED_PASSIONS}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {PASSIONS.map((p) => {
                const on = profile.passions.includes(p);
                const disabled = !on && profile.passions.length >= REQUIRED_PASSIONS;
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={disabled}
                    onClick={() => setProfile((s) => ({ ...s, passions: togglePick(s.passions, p, REQUIRED_PASSIONS) }))}
                    className={cls(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      on
                        ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-50"
                        : "border-white/10 bg-black/10 hover:bg-white/10",
                      disabled && "opacity-40"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {errors.passions && <div className="mt-2 text-xs text-red-300">{errors.passions}</div>}
          </div>
        </div>
      </section>

      {/* Depth */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold">Depth-vragen</h2>
          <p className="mt-1 text-sm opacity-75">Min. {DEPTH_MIN_CHARS} tekens per vraag.</p>
        </div>

        <div className="mt-5 grid gap-4">
          {PROFILE_QUESTIONS.map((qq) => (
            <label key={qq.key} className={labelBase}>
              <span className="opacity-80">{qq.label}</span>
              <textarea
                value={profile[qq.key]}
                onChange={(e) => setProfile((s) => ({ ...s, [qq.key]: e.target.value }))}
                className={textareaBase}
                placeholder="Schrijf iets dat écht iets zegt over jou…"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={errors[qq.key] ? "text-red-300" : "opacity-70"}>
                  {errors[qq.key] ? errors[qq.key] : "✓"}
                </span>
                <span className="opacity-60">{(profile[qq.key] || "").trim().length}</span>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Photos */}
      <ProfilePhotoManager photos={photos} onRefresh={refreshMe} />

      {/* Account */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Account</div>
            <div className="mt-1 text-sm opacity-70">Wil je uitloggen?</div>
          </div>
          <Link
            href="/logout"
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Uitloggen
          </Link>
        </div>
      </section>
    </div>
  );
}

