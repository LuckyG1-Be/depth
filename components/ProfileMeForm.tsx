"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { LocationValue } from "@/components/LocationAutocomplete";
import type { ProfilePhoto } from "@/components/ProfilePhotoManager";
import AccountActionsSection from "@/components/profile/AccountActionsSection";
import ProfileBasicsSection from "@/components/profile/ProfileBasicsSection";
import ProfileDepthQuestionsSection from "@/components/profile/ProfileDepthQuestionsSection";
import ProfileIntentSection from "@/components/profile/ProfileIntentSection";
import ProfileLifestyleSection from "@/components/profile/ProfileLifestyleSection";
import ProfilePhotosSection from "@/components/profile/ProfilePhotosSection";
import ProfileStatusBar from "@/components/profile/ProfileStatusBar";
import ProfileValuesPassionsSection from "@/components/profile/ProfileValuesPassionsSection";
import { DEPTH_MIN_CHARS, MIN_PHOTOS, Q_KEYS, REQUIRED_PASSIONS, REQUIRED_VALUES } from "@/components/profile/constants";
import { useDebouncedEffect } from "@/components/profile/hooks";
import type { Initial, ProfileLocation } from "@/components/profile/types";
import { depthOk, normalizePickList, normalizeProfile, postJson } from "@/components/profile/utils";


function readApiError(value: unknown, fallback: string) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const error = (value as Record<string, unknown>).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

function getErrorMessage(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}
export default function ProfileMeForm({ initial }: { initial: Initial }) {
  const [user, setUser] = useState(initial.user);
  const [profile, setProfile] = useState(() => normalizeProfile(initial.profile));
  const [photos, setPhotos] = useState<ProfilePhoto[]>(initial.photos);

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

  // dirty + latest refs for flush-on-unmount
  const dirtyRef = useRef(false);
  const latestProfileRef = useRef(profile);

  const dirtyUserRef = useRef(false);
  const latestUserRef = useRef(user);
  const latestLocationRef = useRef<LocationValue | null>(location);

  const photoCount = photos.length;

  const refBasics = useRef<HTMLElement>(null);
  const refValues = useRef<HTMLElement>(null);
  const refDepth = useRef<HTMLElement>(null);
  const refPhotos = useRef<HTMLElement>(null);

  function scrollTo(ref: RefObject<HTMLElement>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }


  async function exportAccountData() {
    try {
      setGlobalError(null);
      const res = await fetch("/api/account/export", { method: "GET", cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(readApiError(data, "Export mislukt"));
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] || "depth-account-export.json";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setGlobalError(e?.message || "Export mislukt");
    }
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

  useEffect(() => {
    latestProfileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    latestUserRef.current = user;
  }, [user]);

  useEffect(() => {
    latestLocationRef.current = location;
  }, [location]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!user.name.trim()) e.name = "Voornaam is verplicht.";
    if (!user.gender.trim()) e.gender = "Kies je gender.";

    if (!location) e.city = "Kies je stad uit de lijst (autocomplete).";

    if (!profile.intent.trim()) e.intent = "Kies een intentie.";
    if (profile.values.length !== REQUIRED_VALUES) e.values = `Selecteer exact ${REQUIRED_VALUES} waarden.`;
    if (profile.passions.length !== REQUIRED_PASSIONS) e.passions = `Selecteer exact ${REQUIRED_PASSIONS} passies.`;

    for (const k of Q_KEYS) {
      const t = (profile[k] || "").trim();
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

    const depthMissing = Q_KEYS.some((k) => !!errors[k]);
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
      dirtyUserRef.current = false;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1200);
    } catch (e: any) {
      setGlobalError(e?.message || "Opslaan mislukt");
      setSaveStatus("idle");
    }
  }

  async function saveProfileFull(next: Initial["profile"], opts?: { keepalive?: boolean }) {
    setGlobalError(null);

    const normalized: Initial["profile"] = {
      ...next,
      values: normalizePickList(next.values || [], REQUIRED_VALUES),
      passions: normalizePickList(next.passions || [], REQUIRED_PASSIONS),
    };

    const payload = JSON.stringify(normalized);
    if (payload === lastProfileSentRef.current) return;

    setSaveStatus("saving");
    try {
      await postJson("/api/profile/update-profile", { profile: normalized }, { keepalive: opts?.keepalive });
      lastProfileSentRef.current = payload;
      dirtyRef.current = false;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1200);
    } catch (e: any) {
      setGlobalError(e?.message || "Opslaan mislukt");
      setSaveStatus("idle");
    }
  }

  function applyProfile(updater: (prev: Initial["profile"]) => Initial["profile"]) {
    setProfile((prev) => {
      const next = updater(prev);
      dirtyRef.current = true;
      latestProfileRef.current = next;
      void saveProfileFull(next);
      return next;
    });
  }

  function togglePick(list: string[], item: string, max: number) {
    const base = normalizePickList(list, max);
    const has = base.includes(item);
    if (has) return base.filter((x) => x !== item);
    if (base.length >= max) return base;
    return normalizePickList([...base, item], max);
  }

  // Normalize + persist if initial contains duplicates/empties
  useEffect(() => {
    const normValues = normalizePickList(initial.profile.values || [], REQUIRED_VALUES);
    const normPassions = normalizePickList(initial.profile.passions || [], REQUIRED_PASSIONS);

    const rawValuesCleaned = (initial.profile.values || []).map((x) => String(x || "").trim()).filter(Boolean);
    const rawPassionsCleaned = (initial.profile.passions || []).map((x) => String(x || "").trim()).filter(Boolean);

    const needsPersist =
      rawValuesCleaned.join("|") !== normValues.join("|") || rawPassionsCleaned.join("|") !== normPassions.join("|");

    if (!needsPersist) return;

    const next: Initial["profile"] = {
      ...profile,
      values: normValues,
      passions: normPassions,
    };

    dirtyRef.current = true;
    latestProfileRef.current = next;

    void saveProfileFull(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush profile on unmount (keepalive)
  useEffect(() => {
    return () => {
      if (!dirtyRef.current) return;
      void postJson("/api/profile/update-profile", { profile: latestProfileRef.current }, { keepalive: true }).catch(() => {});
    };
  }, []);

  // User autosave debounced
  useDebouncedEffect(
    () => {
      const nameOk = user.name.trim().length > 0;
      const genderOk = user.gender.trim().length > 0;

      const hasValidLocation =
        !!location && !!location.placeId && typeof location.lat === "number" && typeof location.lng === "number";
      const isClearing = user.city === "" && !location;

      if (!nameOk && !genderOk && !hasValidLocation && !isClearing) return;

      dirtyUserRef.current = true;

      void saveUser({
        name: user.name,
        gender: user.gender,
        city: hasValidLocation ? location!.label : isClearing ? "" : user.city,
        lat: hasValidLocation ? location!.lat : null,
        lng: hasValidLocation ? location!.lng : null,
        placeId: hasValidLocation ? location!.placeId : null,
      });
    },
    [user.name, user.gender, user.city, location?.label, location?.placeId, location?.lat, location?.lng],
    900
  );

  // Flush user on unmount (keepalive)
  useEffect(() => {
    return () => {
      if (!dirtyUserRef.current) return;

      const u = latestUserRef.current;
      const loc = latestLocationRef.current;

      const nameOk = (u?.name || "").trim().length > 0;
      const genderOk = (u?.gender || "").trim().length > 0;
      const hasValidLocation =
        !!loc && !!loc.placeId && typeof loc.lat === "number" && typeof loc.lng === "number" && (loc.label || "").trim().length > 0;
      const isClearing = (u?.city || "") === "" && !loc;

      if (!nameOk && !genderOk && !hasValidLocation && !isClearing) return;

      const payload = {
        name: u.name,
        gender: u.gender,
        city: hasValidLocation ? loc!.label : isClearing ? "" : u.city,
        lat: hasValidLocation ? loc!.lat : null,
        lng: hasValidLocation ? loc!.lng : null,
        placeId: hasValidLocation ? loc!.placeId : null,
      };

      void postJson("/api/profile/update-user", { user: payload }, { keepalive: true }).catch(() => {});
    };
  }, []);

  async function deleteAccount() {
    setDeleting(true);
    setGlobalError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(readApiError(data, "Verwijderen mislukt"));
      }
      window.location.href = "/login";
    } catch (e: unknown) {
      setGlobalError(getErrorMessage(e, "Verwijderen mislukt"));
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  }


  function onNameChange(value: string) {
    dirtyUserRef.current = true;
    setUser((s) => ({ ...s, name: value }));
  }

  function onGenderChange(value: string) {
    dirtyUserRef.current = true;
    setUser((s) => ({ ...s, gender: value }));
  }

  function onLocationChange(value: ProfileLocation) {
    dirtyUserRef.current = true;
    setLocation(value);
    setUser((s) => ({ ...s, city: value?.label || "" }));
  }

  return (
    <div className="space-y-3.5 overflow-x-hidden sm:space-y-6">
      {isComplete ? (
        globalError ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-50">{globalError}</div> : null
      ) : (
        <ProfileStatusBar globalError={globalError} saveStatus={saveStatus} checklist={checklist} />
      )}

      <ProfileBasicsSection
        sectionRef={refBasics}
        user={user}
        location={location}
        errors={errors}
        onNameChange={onNameChange}
        onGenderChange={onGenderChange}
        onLocationChange={onLocationChange}
      />

      <ProfileIntentSection profile={profile} errors={errors} applyProfile={applyProfile} />
      <ProfileLifestyleSection profile={profile} applyProfile={applyProfile} />

      <ProfileValuesPassionsSection
        sectionRef={refValues}
        profile={profile}
        errors={errors}
        applyProfile={applyProfile}
        togglePick={togglePick}
      />

      <ProfileDepthQuestionsSection sectionRef={refDepth} profile={profile} errors={errors} applyProfile={applyProfile} />

      <ProfilePhotosSection sectionRef={refPhotos} photos={photos} errors={errors} refreshMe={refreshMe} />

      <AccountActionsSection
        confirmDeleteOpen={confirmDeleteOpen}
        deleting={deleting}
        exportAccountData={exportAccountData}
        deleteAccount={deleteAccount}
        setConfirmDeleteOpen={setConfirmDeleteOpen}
      />

      <div className="hidden">
        <div>{String(isComplete)}</div>
      </div>
    </div>
  );
}
