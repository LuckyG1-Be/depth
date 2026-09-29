"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  PROFILE_DRINKING,
  PROFILE_EDUCATIONS,
  PROFILE_EXERCISE,
  PROFILE_SMOKING,
} from "@/lib/profileData";
import { TOOL_COSTS } from "@/lib/wallet/costs";
import {
  ageLabel,
  BRAND_GREEN,
  cls,
  GENDER_VALUES,
  labelForGenderValue,
  type PreferencesVariant,
  type SaveStatus,
} from "@/components/preferences/PreferencesTypes";

type PreferencesFormSectionsProps = {
  error: string | null;
  status: SaveStatus;
  variant: PreferencesVariant;
  onClose?: () => void;
  saving: boolean;
  genders: string[];
  everyone: boolean;
  onToggleGender: (value: "Vrouw" | "Man") => void;

  minAge: number;
  maxAge: number;
  setMinAge: Dispatch<SetStateAction<number>>;
  setMaxAge: Dispatch<SetStateAction<number>>;

  maxDistanceKm: number;
  setMaxDistanceKm: Dispatch<SetStateAction<number>>;

  lifestyleFiltersActive: boolean;
  lifestyleFiltersUntil: string | null;
  unlockingLifestyle: boolean;
  onUnlockLifestyle: () => void;

  educationFilter: string;
  drinkingFilter: string;
  smokingFilter: string;
  exerciseFilter: string;
  setEducationFilter: Dispatch<SetStateAction<string>>;
  setDrinkingFilter: Dispatch<SetStateAction<string>>;
  setSmokingFilter: Dispatch<SetStateAction<string>>;
  setExerciseFilter: Dispatch<SetStateAction<string>>;
};

export function PreferencesLoadingState() {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm opacity-70">Laden…</div>;
}

export function PreferencesFormSections(props: PreferencesFormSectionsProps) {
  return (
    <div className="space-y-6">
      {props.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm">{props.error}</div>
      ) : null}

      <PreferencesStatusBar status={props.status} variant={props.variant} onClose={props.onClose} />

      <GenderSection
        saving={props.saving}
        genders={props.genders}
        everyone={props.everyone}
        onToggleGender={props.onToggleGender}
      />

      <AgeSection
        saving={props.saving}
        minAge={props.minAge}
        maxAge={props.maxAge}
        setMinAge={props.setMinAge}
        setMaxAge={props.setMaxAge}
      />

      <DistanceSection
        saving={props.saving}
        maxDistanceKm={props.maxDistanceKm}
        setMaxDistanceKm={props.setMaxDistanceKm}
      />

      <LifestyleFiltersSection
        saving={props.saving}
        lifestyleFiltersActive={props.lifestyleFiltersActive}
        lifestyleFiltersUntil={props.lifestyleFiltersUntil}
        unlockingLifestyle={props.unlockingLifestyle}
        onUnlockLifestyle={props.onUnlockLifestyle}
        educationFilter={props.educationFilter}
        drinkingFilter={props.drinkingFilter}
        smokingFilter={props.smokingFilter}
        exerciseFilter={props.exerciseFilter}
        setEducationFilter={props.setEducationFilter}
        setDrinkingFilter={props.setDrinkingFilter}
        setSmokingFilter={props.setSmokingFilter}
        setExerciseFilter={props.setExerciseFilter}
      />
    </div>
  );
}

function PreferencesStatusBar({
  status,
  variant,
  onClose,
}: {
  status: SaveStatus;
  variant: PreferencesVariant;
  onClose?: () => void;
}) {
  return (
    <div className="depth-card-muted flex items-center justify-between gap-3 p-3 sm:p-4">
      <div>
        <div className="text-sm font-semibold text-white">Basisfilters</div>
        <div className="mt-0.5 text-xs text-white/50">Automatisch opgeslagen.</div>
      </div>
      <div className="min-h-5 text-xs font-semibold text-white/60">
        {status === "saving" ? "Opslaan…" : status === "saved" ? "Opgeslagen ✓" : ""}
      </div>
      {variant === "modal" && onClose ? (
        <button type="button" onClick={onClose} className="sr-only" aria-label="Sluiten" />
      ) : null}
    </div>
  );
}

function GenderSection({
  saving,
  genders,
  everyone,
  onToggleGender,
}: {
  saving: boolean;
  genders: string[];
  everyone: boolean;
  onToggleGender: (value: "Vrouw" | "Man") => void;
}) {
  return (
    <section className="depth-card p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Wie wil je zien?</div>
          <div className="mt-1 text-sm opacity-70">Kies één of beide.</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold">
          {everyone ? "Iedereen" : genders.map(labelForGenderValue).join(" & ")}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {GENDER_VALUES.map((value) => {
          const on = genders.includes(value);
          const label = labelForGenderValue(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggleGender(value)}
              disabled={saving}
              className={cls(
                "rounded-full border px-4 py-2 text-sm transition disabled:opacity-60",
                on
                  ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-50"
                  : "border-white/10 bg-black/10 hover:bg-white/10"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AgeSection({
  saving,
  minAge,
  maxAge,
  setMinAge,
  setMaxAge,
}: {
  saving: boolean;
  minAge: number;
  maxAge: number;
  setMinAge: Dispatch<SetStateAction<number>>;
  setMaxAge: Dispatch<SetStateAction<number>>;
}) {
  return (
    <section className="depth-card p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Leeftijd</div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold">
          {ageLabel(minAge)} – {ageLabel(maxAge)}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <RangeField
          label="Minimum"
          min={18}
          max={65}
          value={minAge}
          onChange={setMinAge}
          disabled={saving}
        />
        <RangeField
          label="Maximum"
          min={18}
          max={65}
          value={maxAge}
          onChange={setMaxAge}
          disabled={saving}
        />
      </div>

      <div className="mt-2 text-sm opacity-70">Tip: 65 betekent “65+”.</div>
    </section>
  );
}

function DistanceSection({
  saving,
  maxDistanceKm,
  setMaxDistanceKm,
}: {
  saving: boolean;
  maxDistanceKm: number;
  setMaxDistanceKm: Dispatch<SetStateAction<number>>;
}) {
  return (
    <section className="depth-card p-4 sm:p-6">
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
          onChange={(event) => setMaxDistanceKm(Number(event.target.value))}
          className="depth-range w-full"
          style={{ accentColor: BRAND_GREEN }}
          disabled={saving}
        />
      </div>

      <div className="mt-2 text-sm opacity-70">Tip: 15–35 km voelt vaak het beste voor “in de buurt”.</div>
    </section>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  onChange,
  disabled,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: Dispatch<SetStateAction<number>>;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="text-sm font-semibold opacity-80">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="depth-range mt-2 w-full"
        style={{ accentColor: BRAND_GREEN }}
        disabled={disabled}
      />
    </div>
  );
}

function LifestyleFiltersSection({
  saving,
  lifestyleFiltersActive,
  lifestyleFiltersUntil,
  unlockingLifestyle,
  onUnlockLifestyle,
  educationFilter,
  drinkingFilter,
  smokingFilter,
  exerciseFilter,
  setEducationFilter,
  setDrinkingFilter,
  setSmokingFilter,
  setExerciseFilter,
}: {
  saving: boolean;
  lifestyleFiltersActive: boolean;
  lifestyleFiltersUntil: string | null;
  unlockingLifestyle: boolean;
  onUnlockLifestyle: () => void;
  educationFilter: string;
  drinkingFilter: string;
  smokingFilter: string;
  exerciseFilter: string;
  setEducationFilter: Dispatch<SetStateAction<string>>;
  setDrinkingFilter: Dispatch<SetStateAction<string>>;
  setSmokingFilter: Dispatch<SetStateAction<string>>;
  setExerciseFilter: Dispatch<SetStateAction<string>>;
}) {
  return (
    <section className="depth-card-muted p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Premium compatibiliteitsfilters</div>
          <div className="mt-1 text-sm opacity-70">Opleiding, drinken, roken en sporten. Tijdelijk actief na ontgrendeling.</div>
        </div>

        <div className="flex items-center gap-2">
          {lifestyleFiltersActive ? (
            <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-50">
              Actief tot {new Date(lifestyleFiltersUntil as string).toLocaleDateString("nl-BE")}
            </div>
          ) : (
            <button
              type="button"
              onClick={onUnlockLifestyle}
              disabled={saving || unlockingLifestyle}
              className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-400/15 disabled:opacity-60"
            >
              {unlockingLifestyle ? "Ontgrendelen…" : `Ontgrendel 4 weken — ${TOOL_COSTS.LIFESTYLE_FILTERS} tokens`}
            </button>
          )}
        </div>
      </div>

      {!lifestyleFiltersActive ? <LifestyleLockedNotice /> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <SelectFilter
          label="Opleiding"
          value={educationFilter}
          options={PROFILE_EDUCATIONS}
          disabled={!lifestyleFiltersActive || saving}
          onChange={setEducationFilter}
        />
        <SelectFilter
          label="Drinken"
          value={drinkingFilter}
          options={PROFILE_DRINKING}
          disabled={!lifestyleFiltersActive || saving}
          onChange={setDrinkingFilter}
        />
        <SelectFilter
          label="Roken"
          value={smokingFilter}
          options={PROFILE_SMOKING}
          disabled={!lifestyleFiltersActive || saving}
          onChange={setSmokingFilter}
        />
        <SelectFilter
          label="Sporten"
          value={exerciseFilter}
          options={PROFILE_EXERCISE}
          disabled={!lifestyleFiltersActive || saving}
          onChange={setExerciseFilter}
        />
      </div>
    </section>
  );
}

function LifestyleLockedNotice() {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm">
      <div className="font-semibold">Compatibiliteitsfilters</div>
      <div className="mt-2 opacity-80">Filter profielen op:</div>

      <ul className="mt-2 list-disc pl-5 opacity-80">
        <li>opleiding</li>
        <li>roken</li>
        <li>drinken</li>
        <li>sporten</li>
      </ul>

      <div className="mt-3 opacity-80">Ontgrendel deze filters 4 weken lang.</div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  disabled: boolean;
  onChange: Dispatch<SetStateAction<string>>;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="opacity-80">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30 disabled:opacity-60"
      >
        <option value="">Geen filter</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
