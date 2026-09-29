import { PROFILE_DRINKING, PROFILE_EDUCATIONS, PROFILE_EXERCISE, PROFILE_SMOKING } from "@/lib/profileData";
import type { ApplyProfile, ProfileState } from "./types";

export default function ProfileLifestyleSection({ profile, applyProfile }: { profile: ProfileState; applyProfile: ApplyProfile }) {
  return (
    <section className="depth-card-muted p-3.5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="depth-eyebrow">Optioneel</div>
          <h2 className="mt-1 text-lg font-semibold text-white">Levensstijl</h2>
          <p className="mt-1 text-sm text-white/60">Kort invullen helpt matching, maar blokkeert je profiel niet.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3.5 sm:mt-5 sm:gap-4 sm:grid-cols-2">
        <Select label="Opleiding" value={profile.education || ""} options={PROFILE_EDUCATIONS} onChange={(value) => applyProfile((s) => ({ ...s, education: value }))} />
        <Select label="Drinken" value={profile.drinking || ""} options={PROFILE_DRINKING} onChange={(value) => applyProfile((s) => ({ ...s, drinking: value }))} />
        <Select label="Roken" value={profile.smoking || ""} options={PROFILE_SMOKING} onChange={(value) => applyProfile((s) => ({ ...s, smoking: value }))} />
        <Select label="Sporten" value={profile.exercise || ""} options={PROFILE_EXERCISE} onChange={(value) => applyProfile((s) => ({ ...s, exercise: value }))} />
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-white/78">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="depth-input px-3 py-3 text-base sm:text-sm">
        <option value="">Niet ingevuld</option>
        {options.map((x) => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>
    </label>
  );
}
