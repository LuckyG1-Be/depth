import Link from "next/link";
import type { RefObject } from "react";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { GENDER_OPTIONS } from "./constants";
import type { ProfileErrors, ProfileLocation, UserState } from "./types";

export default function ProfileBasicsSection({
  sectionRef,
  user,
  location,
  errors,
  onNameChange,
  onGenderChange,
  onLocationChange,
}: {
  sectionRef: RefObject<HTMLElement>;
  user: UserState;
  location: ProfileLocation;
  errors: ProfileErrors;
  onNameChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onLocationChange: (value: ProfileLocation) => void;
}) {
  return (
    <section className="depth-card scroll-mt-24 p-3.5 sm:p-6" ref={sectionRef}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="depth-eyebrow">Stap 1</div>
          <h2 className="mt-1 text-lg font-semibold text-white">Wie ben ik?</h2>
          <p className="mt-1 text-sm text-white/62">Naam, gender en stad zijn nodig voor profielkaarten en afstand.</p>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white/65">Basis</div>
      </div>

      <div className="mt-4 grid gap-3.5 sm:mt-5 sm:gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className={errors.name ? "text-red-300" : "text-white/78"}>Voornaam</span>
          <input
            value={user.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="depth-input px-3 py-3 text-base sm:text-sm"
            placeholder="Jouw voornaam"
          />
          {errors.name && <div className="text-xs text-red-300">{errors.name}</div>}
        </label>

        <label className="grid gap-2 text-sm">
          <span className={errors.gender ? "text-red-300" : "text-white/78"}>Gender</span>
          <select
            value={user.gender}
            onChange={(e) => onGenderChange(e.target.value)}
            className="depth-input px-3 py-3 text-base sm:text-sm"
          >
            <option value="">Kies…</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {errors.gender && <div className="text-xs text-red-300">{errors.gender}</div>}
        </label>

        <div className="grid gap-2 text-sm sm:col-span-2">
          <div className={errors.city ? "text-red-300" : "text-white/78"}>Stad</div>
          <LocationAutocomplete value={location} onChange={onLocationChange} />
          {errors.city && <div className="text-xs text-red-300">{errors.city}</div>}
          <div className="text-xs text-white/50">
            Afstand en filters pas je aan via{" "}
            <Link className="text-emerald-100 underline decoration-emerald-300/40" href="/profile/preferences">
              Datingvoorkeuren
            </Link>
            .
          </div>
        </div>
      </div>
    </section>
  );
}
