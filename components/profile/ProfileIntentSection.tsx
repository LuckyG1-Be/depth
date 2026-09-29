import { PROFILE_INTENTS, PROFILE_RELIGIONS } from "@/lib/profileData";
import type { ApplyProfile, ProfileErrors, ProfileState } from "./types";

export default function ProfileIntentSection({ profile, errors, applyProfile }: { profile: ProfileState; errors: ProfileErrors; applyProfile: ApplyProfile }) {
  return (
    <section className="depth-card p-3.5 sm:p-6">
      <div className="depth-eyebrow">Stap 2</div>
      <h2 className="mt-1 text-lg font-semibold text-white">Wat zoek ik?</h2>
      <p className="mt-1 text-sm text-white/62">Je intentie helpt om verwachtingen sneller gelijk te zetten.</p>

      <div className="mt-4 grid gap-3.5 sm:mt-5 sm:gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className={errors.intent ? "text-red-300" : "text-white/78"}>Intentie</span>
          <select
            value={profile.intent}
            onChange={(e) => applyProfile((s) => ({ ...s, intent: e.target.value }))}
            className="depth-input px-3 py-3 text-base sm:text-sm"
          >
            <option value="">Kies…</option>
            {PROFILE_INTENTS.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
          {errors.intent && <div className="text-xs text-red-300">{errors.intent}</div>}
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-white/78">Religie <span className="text-white/40">optioneel</span></span>
          <select
            value={profile.religion || ""}
            onChange={(e) => applyProfile((s) => ({ ...s, religion: e.target.value }))}
            className="depth-input px-3 py-3 text-base sm:text-sm"
          >
            <option value="">Geen voorkeur</option>
            {PROFILE_RELIGIONS.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
