import type { RefObject } from "react";
import { PROFILE_QUESTIONS } from "@/lib/profileData";
import { DEPTH_MIN_CHARS, Q_KEYS } from "./constants";
import type { ApplyProfile, Initial, ProfileErrors, ProfileState, QKey } from "./types";

const EXAMPLES = [
  "Bijvoorbeeld: wat geeft jou energie in een relatie?",
  "Bijvoorbeeld: wat vind je belangrijk als iemand je leert kennen?",
  "Bijvoorbeeld: waar wil je samen ruimte voor maken?",
  "Bijvoorbeeld: wanneer voel jij je echt op je gemak?",
  "Bijvoorbeeld: wat hoop je dat iemand aan jou apprecieert?",
];

export default function ProfileDepthQuestionsSection({
  sectionRef,
  profile,
  errors,
  applyProfile,
}: {
  sectionRef: RefObject<HTMLElement>;
  profile: ProfileState;
  errors: ProfileErrors;
  applyProfile: ApplyProfile;
}) {
  return (
    <section ref={sectionRef} className="depth-card scroll-mt-24 p-3.5 sm:p-6">
      <div className="depth-eyebrow">Stap 4</div>
      <h2 className="mt-1 text-lg font-semibold text-white">Depth-vragen</h2>
      <p className="mt-1 text-sm text-white/62">Korte, echte antwoorden werken beter dan perfecte teksten.</p>

      <div className="mt-4 grid gap-3.5 sm:mt-5 sm:gap-4">
        {PROFILE_QUESTIONS.map((q, i) => {
          const key = Q_KEYS[i] as QKey;
          const val = profile[key];
          const err = errors[key];
          const length = (val || "").trim().length;
          const ok = length >= DEPTH_MIN_CHARS;

          return (
            <label key={key} className="grid gap-2 rounded-2xl border border-white/10 bg-black/15 p-3 text-sm sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className={err ? "text-red-300" : "text-white/85"}>{q}</div>
                <div className={ok ? "text-xs font-semibold text-emerald-200" : "text-xs text-white/45"}>{length}/{DEPTH_MIN_CHARS}</div>
              </div>
              <textarea
                value={val}
                onChange={(e) => {
                  const v = e.target.value;
                  applyProfile((s) => ({ ...s, [key]: v } as Initial["profile"]));
                }}
                rows={3}
                className="depth-input min-h-[96px] px-3 py-3 text-base sm:text-sm"
                placeholder={EXAMPLES[i] || "Vertel kort iets persoonlijks."}
              />
              {err ? <div className="text-xs text-red-300">{err}</div> : <div className="text-xs text-white/42">Min. {DEPTH_MIN_CHARS} tekens.</div>}
            </label>
          );
        })}
      </div>
    </section>
  );
}
