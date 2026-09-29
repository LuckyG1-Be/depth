import type { RefObject } from "react";
import { PROFILE_PASSIONS, PROFILE_VALUES } from "@/lib/profileData";
import { REQUIRED_PASSIONS, REQUIRED_VALUES } from "./constants";
import type { ApplyProfile, ProfileErrors, ProfileState } from "./types";
import { cls } from "./utils";

export default function ProfileValuesPassionsSection({
  sectionRef,
  profile,
  errors,
  applyProfile,
  togglePick,
}: {
  sectionRef: RefObject<HTMLElement>;
  profile: ProfileState;
  errors: ProfileErrors;
  applyProfile: ApplyProfile;
  togglePick: (list: string[], item: string, max: number) => string[];
}) {
  return (
    <section ref={sectionRef} className="depth-card scroll-mt-24 overflow-hidden p-3.5 sm:p-6">
      <div className="depth-eyebrow">Stap 3</div>
      <h2 className="mt-1 text-lg font-semibold text-white">Wat maakt mij mij?</h2>
      <p className="mt-1 text-[13px] text-white/62 sm:text-sm">Kies je kernwaarden en passies. Exact kiezen houdt profielen vergelijkbaar.</p>

      <div className="mt-4 grid gap-5 sm:mt-5 sm:gap-6">
        <PickGroup
          title="Waarden"
          selected={profile.values}
          required={REQUIRED_VALUES}
          options={PROFILE_VALUES}
          error={errors.values}
          onToggle={(v) => applyProfile((s) => ({ ...s, values: togglePick(s.values, v, REQUIRED_VALUES) }))}
        />

        <PickGroup
          title="Passies"
          selected={profile.passions}
          required={REQUIRED_PASSIONS}
          options={PROFILE_PASSIONS}
          error={errors.passions}
          onToggle={(v) => applyProfile((s) => ({ ...s, passions: togglePick(s.passions, v, REQUIRED_PASSIONS) }))}
        />
      </div>
    </section>
  );
}

function PickGroup({ title, selected, required, options, error, onToggle }: { title: string; selected: string[]; required: number; options: readonly string[]; error?: string; onToggle: (value: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className={cls("rounded-full border px-2.5 py-1 text-xs font-semibold", error ? "border-red-300/20 bg-red-400/10 text-red-200" : "border-white/10 bg-black/20 text-white/65")}>
          {selected.length}/{required}
        </div>
      </div>

      <div className="mt-3 flex max-w-full flex-wrap gap-1.5 overflow-hidden pb-0 sm:gap-2">
        {options.map((v) => {
          const on = selected.includes(v);
          const disabled = !on && selected.length >= required;

          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(v)}
              className={cls(
                "min-w-0 max-w-full rounded-full border px-2.5 py-1.5 text-xs transition sm:px-3.5 sm:py-2 sm:text-sm",
                on
                  ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-50"
                  : disabled
                    ? "cursor-not-allowed border-white/5 bg-white/5 text-white/35"
                    : "border-white/10 bg-black/10 text-white/85 hover:bg-white/10"
              )}
            >
              <span className="block max-w-full truncate">{v}</span>
            </button>
          );
        })}
      </div>
      {error && <div className="mt-2 text-xs text-red-300">{error}</div>}
    </div>
  );
}
