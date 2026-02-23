"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ProfilePhotoManager, { type ProfilePhoto } from "@/components/ProfilePhotoManager";
import { VALUES, PASSIONS } from "@/lib/profileOptions";
import LocationAutocomplete, { type LocationValue } from "@/components/LocationAutocomplete";

type Initial = {
  user: {
    name: string;
    city: string;
    gender: string;
    lat?: number | null;
    lng?: number | null;
    placeId?: string | null;
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

const INTENTS = ["Serieuze relatie", "Casual", "Vriendschap", "Nog aan het kijken"];
const RELIGIONS = ["Geen", "Christelijk", "Islam", "Joods", "Hindoe", "Boeddhist", "Anders"];

const GENDER_OPTIONS = ["Vrouw", "Man"];

const REQUIRED_VALUES = 3;
const REQUIRED_PASSIONS = 4;

const MIN_PHOTOS = 3;
const DEPTH_MIN_CHARS = 25;

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

function depthOk(profile: Initial["profile"]) {
  return [profile.q1, profile.q2, profile.q3, profile.q4, profile.q5].every((x) => x.trim().length >= DEPTH_MIN_CHARS);
}

export default function ProfileMeForm({ initial }: { initial: Initial }) {
  const [user, setUser] = useState(initial.user);
  const [profile, setProfile] = useState(initial.profile);
  const [photos, setPhotos] = useState<ProfilePhoto[]>(initial.photos);

  // locatie state (bron van waarheid voor city + coords)
  const [location, setLocation] = useState<LocationValue | null>(() => {
    const city = (initial.user.city || "").trim();
    const placeId = (initial.user.placeId || "").trim();
    const lat = initial.user.lat ?? null;
    const lng = initial.user.lng ?? null;
    if (city && placeId && typeof lat === "number" && typeof lng === "number") {
      return { label: city, placeId, lat, lng };
    }
    return null;
  });

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const lastUserSentRef = useRef<string>("");
  const lastProfileSentRef = useRef<string>("");

  const photoCount = photos.length;

  const refBasics = useRef<HTMLDivElement | null>(null);
  const refValues = useRef<HTMLDivElement | null>(null);
  const refDepth = useRef<HTMLDivElement | null>(null);
  const refPhotos = useRef<HTMLDivElement | null>(null);

  function scrollTo(ref: React.RefObject<HTMLDivElement>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!user.name.trim()) e.name = "Voornaam is verplicht.";

    // ✅ Stad is verplicht EN moet gekozen zijn
    if (!location) e.city = "Kies je stad uit de lijst (autocomplete).";

    if (!user.gender.trim()) e.gender = "Kies je gender.";

    if (!profile.intent.trim()) e.intent = "Kies een intentie.";
    if (profile.values.length !== REQUIRED_VALUES) e.values = `Selecteer exact ${REQUIRED_VALUES} waarden.`;
    if (profile.passions.length !== REQUIRED_PASSIONS) e.passions = `Selecteer exact ${REQUIRED_PASSIONS} passies.`;

    const qs = [
      ["q1", profile.q1],
      ["q2", profile.q2],
      ["q3", profile.q3],
      ["q4", profile.q4],
      ["q5", profile.q5],
    ] as const;

    for (const [k, v] of qs) {
      const t = v.trim();
      if (!t) e[k] = "Verplicht.";
      else if (t.length < DEPTH_MIN_CHARS) e[k] = `Min. ${DEPTH_MIN_CHARS} tekens.`;
    }

    if (photoCount < MIN_PHOTOS) e.photos = `Upload min. ${MIN_PHOTOS} foto’s.`;

    return e;
  }, [photoCount, profile, user.name, user.gender, location]);

  const isComplete = useMemo(() => {
    const basicsOk = user.name.trim().length > 0 && user.gender.trim().length > 0 && !!location;
    const intentOk = profile.intent.trim().length > 0;
    const valuesOk = profile.values.length === REQUIRED_VALUES;
    const passionsOk = profile.passions.length === REQUIRED_PASSIONS;
    const photosOk = photoCount >= MIN_PHOTOS;
    const depthAllOk = depthOk(profile);
    return basicsOk && intentOk && valuesOk && passionsOk && photosOk && depthAllOk;
  }, [user.name, user.gender, location, profile, photoCount]);

  const checklist = useMemo(() => {
    const items: Array<{ key: string; title: string; hint: string; go: () => void }> = [];

    if (errors.photos) items.push({ key: "photos", title: "Foto’s", hint: errors.photos, go: () => scrollTo(refPhotos) });
    if (errors.city) items.push({ key: "city", title: "Stad", hint: errors.city, go: () => scrollTo(refBasics) });
    if (errors.name) items.push({ key: "name", title: "Voornaam", hint: errors.name, go: () => scrollTo(refBasics) });
    if (errors.gender) items.push({ key: "gender", title: "Gender", hint: errors.gender, go: () => scrollTo(refBasics) });
    if (errors.intent) items.push({ key: "intent", title: "Intentie", hint: errors.intent, go: () => scrollTo(refBasics) });
    if (errors.values) items.push({ key: "values", title: "Waarden", hint: errors.values, go: () => scrollTo(refValues) });
    if (errors.passions) items.push({ key: "passions", title: "Passies", hint: errors.passions, go: () => scrollTo(refValues) });

    const depthMissing = [errors.q1, errors.q2, errors.q3, errors.q4, errors.q5].some(Boolean);
    if (depthMissing) items.push({ key: "depth", title: "Depth-vragen", hint: "Vul alle vragen in.", go: () => scrollTo(refDepth) });

    return items;
  }, [errors]);

  async function saveUser(partial: Partial<Initial["user"]>) {
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

  async function saveProfile(partial: Partial<Initial["profile"]>) {
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

  // Autosave: user fields
  useDebouncedEffect(
    () => {
      if (!user.name.trim() || !user.gender.trim()) return;
      if (!location) return;

      void saveUser({
        name: user.name,
        gender: user.gender,
        city: location.label,
        lat: location.lat,
        lng: location.lng,
        placeId: location.placeId,
      });
    },
    [user.name, user.gender, location?.placeId, location?.label, location?.lat, location?.lng],
    850
  );

  // Autosave: profile fields
  useDebouncedEffect(
    () => {
      // religie mag leeg zijn
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
    },
    [
      profile.intent,
      profile.religion,
      profile.values.join("|"),
      profile.passions.join("|"),
      profile.q1,
      profile.q2,
      profile.q3,
      profile.q4,
      profile.q5,
    ],
    1050
  );

  function togglePick(list: string[], item: string, max: number) {
    const has = list.includes(item);
    if (has) return list.filter((x) => x !== item);
    if (list.length >= max) return list;
    return [...list, item];
  }

  async function deleteAccount() {
    setDeleting(true);
    setGlobalError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Verwijderen mislukt");
      }
      window.location.href = "/login";
    } catch (e: any) {
      setGlobalError(e?.message || "Verwijderen mislukt");
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  }

  return (
    <div className="space-y-8">
      {globalError && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm">{globalError}</div>}

      {/* Subtiele autosave status + CTA */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs opacity-70">
          {saveStatus === "saving" ? "Automatisch opslaan…" : saveStatus === "saved" ? "Automatisch opgeslagen ✓" : "Alles wordt automatisch opgeslagen."}
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Naar Discover
        </Link>
      </div>

      {/* Checklist alleen als het niet compleet is */}
      {!isComplete ? (
        <section className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-6">
          <div className="flex flex-col gap-1">
            <div className="text-lg font-semibold text-amber-50">Nog niet klaar</div>
            <div className="text-sm text-amber-50/90">Vul onderstaande items aan om Discover te ontgrendelen.</div>
          </div>

          <div className="mt-4 grid gap-2">
            {checklist.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={it.go}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10"
              >
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-xs opacity-75">{it.hint}</div>
                </div>
                <div className="text-xs opacity-70">Ga naar</div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Basis */}
      <section ref={refBasics} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Mijn profiel</h2>
        <p className="mt-1 text-sm opacity-70">Naam, gender en stad (nodig voor afstand).</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="opacity-80">Voornaam</span>
            <input
              value={user.name}
              onChange={(e) => setUser((s) => ({ ...s, name: e.target.value }))}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30"
              placeholder="Voornaam"
            />
            {errors.name && <div className="text-xs text-red-300">{errors.name}</div>}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="opacity-80">Gender</span>
            <select
              value={user.gender}
              onChange={(e) => setUser((s) => ({ ...s, gender: e.target.value }))}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30"
            >
              <option value="">Kies…</option>
              {GENDER_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            {errors.gender && <div className="text-xs text-red-300">{errors.gender}</div>}
          </label>

          <label className="grid gap-2 text-sm sm:col-span-2">
            <span className="opacity-80">Stad</span>
            <LocationAutocomplete
              value={location}
              onChange={(v) => {
                setLocation(v);
                setUser((s) => ({ ...s, city: v?.label ?? "" }));
              }}
              placeholder="Typ en kies…"
            />
            {errors.city && <div className="text-xs text-red-300">{errors.city}</div>}
            <div className="text-[11px] opacity-60">Tip: kies je stad altijd uit de lijst — dan werkt afstand in Discover.</div>
          </label>

          <label className="grid gap-2 text-sm sm:col-span-2">
            <span className="opacity-80">Intentie</span>
            <select
              value={profile.intent}
              onChange={(e) => setProfile((s) => ({ ...s, intent: e.target.value }))}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30"
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

          <label className="grid gap-2 text-sm sm:col-span-2">
            <span className="opacity-80">Religie</span>
            <select
              value={profile.religion}
              onChange={(e) => setProfile((s) => ({ ...s, religion: e.target.value }))}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30"
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

        <div className="mt-3 text-xs opacity-70">
          Je Discover filters wijzig je via{" "}
          <Link className="underline decoration-emerald-300/40" href="/profile/preferences">
            Datingvoorkeuren
          </Link>
          .
        </div>
      </section>

      {/* Waarden & passies */}
      <section ref={refValues} className="rounded-3xl border border-white/10 bg-white/5 p-6">
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
                        : disabled
                        ? "cursor-not-allowed border-white/5 bg-white/5 text-white/35"
                        : "border-white/10 bg-black/10 text-white/85 hover:bg-white/10"
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
                        : disabled
                        ? "cursor-not-allowed border-white/5 bg-white/5 text-white/35"
                        : "border-white/10 bg-black/10 text-white/85 hover:bg-white/10"
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
      <section ref={refDepth} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold">Depth-vragen</h2>
          <p className="mt-1 text-sm opacity-75">Min. {DEPTH_MIN_CHARS} tekens per vraag.</p>
        </div>

        <div className="mt-5 grid gap-4">
          {([
            ["Wat is voor jou een perfecte zaterdag?", "q1"],
            ["Wat waardeer jij het meest in een relatie?", "q2"],
            ["Waar kijk je het meest naar uit dit jaar?", "q3"],
            ["Wat is een kleine gewoonte die je leven beter maakt?", "q4"],
            ["Wat wil je dat iemand over jou begrijpt vanaf het begin?", "q5"],
          ] as const).map(([label, key]) => (
            <label key={key} className="grid gap-2 text-sm">
              <span className="opacity-80">{label}</span>
              <textarea
                value={profile[key]}
                onChange={(e) => setProfile((s) => ({ ...s, [key]: e.target.value }))}
                className="min-h-[110px] rounded-2xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30"
                placeholder="Schrijf iets dat écht iets zegt over jou…"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={errors[key] ? "text-red-300" : "opacity-70"}>{errors[key] ? errors[key] : "✓"}</span>
                <span className="opacity-60">{profile[key].trim().length}</span>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Photos */}
      <div ref={refPhotos}>
        <ProfilePhotoManager photos={photos} onRefresh={refreshMe} />
      </div>

      {/* Account + GDPR */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-lg font-semibold">Account</div>
            <div className="mt-1 text-sm opacity-70">Beheer je gegevens. Download je data, log uit of verwijder je account.</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/account/export"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Gegevens downloaden
            </a>

            <Link
              href="/logout"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Uitloggen
            </Link>

            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="inline-flex items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15"
            >
              Account verwijderen
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs opacity-70">
          Door je account te gebruiken ga je akkoord met ons privacybeleid en het verwerken van noodzakelijke data voor matching & veiligheid.
        </div>

        {confirmDeleteOpen ? (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="text-sm font-semibold">Account definitief verwijderen?</div>
            <div className="mt-1 text-sm opacity-80">Dit verwijdert je profiel, foto’s, likes en matches. Deze actie kan niet ongedaan worden gemaakt.</div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={deleting}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={deleting}
                className="rounded-2xl border border-red-500/25 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-50 hover:bg-red-500/20 disabled:opacity-60"
              >
                {deleting ? "Verwijderen…" : "Ja, verwijder mijn account"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}