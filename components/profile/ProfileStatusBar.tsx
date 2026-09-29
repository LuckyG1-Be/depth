import Link from "next/link";
import type { ChecklistItem } from "./types";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const TOTAL_PROFILE_STEPS = 9;

export default function ProfileStatusBar({
  globalError,
  saveStatus,
  checklist,
}: {
  globalError: string | null;
  saveStatus: "idle" | "saving" | "saved";
  checklist: ChecklistItem[];
}) {
  const isComplete = checklist.length === 0;
  const done = Math.max(0, TOTAL_PROFILE_STEPS - checklist.length);
  const pct = Math.max(0, Math.min(100, Math.round((done / TOTAL_PROFILE_STEPS) * 100)));
  const saveLabel = saveStatus === "saving" ? "Opslaan…" : saveStatus === "saved" ? "Opgeslagen" : "Autosave actief";
  const todoLabel = isComplete ? "Profiel klaar" : `${checklist.length} ${checklist.length === 1 ? "punt" : "punten"} te doen`;

  return (
    <>
      {globalError && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-50">{globalError}</div>}

      <div
        className={cls(
          "depth-card p-4 sm:p-5",
          isComplete ? "border-emerald-300/20 bg-emerald-400/10" : ""
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className={cls("text-sm font-semibold", isComplete ? "text-emerald-50" : "text-white/90")}>{todoLabel}</div>
              <div className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white/65">
                {saveLabel}
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/25">
              <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-white/55">{pct}% compleet · foto’s, basisinfo, waarden en Depth-vragen tellen mee.</div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href="/onboarding" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10">
              Startflow
            </Link>
            {!isComplete ? (
              <Link href="/verify" className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-400/15">
                Verificatie
              </Link>
            ) : (
              <Link href="/discover" className="rounded-full border border-emerald-300/20 bg-emerald-400 px-3 py-2 text-xs font-semibold text-black transition hover:bg-emerald-300">
                Naar Discover
              </Link>
            )}
          </div>
        </div>

        {!isComplete ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {checklist.slice(0, 6).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.go}
                className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/85 transition hover:bg-white/10"
                title={c.hint}
              >
                {c.title}
              </button>
            ))}
            {checklist.length > 6 ? <div className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">+{checklist.length - 6}</div> : null}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-emerald-300/15 bg-black/15 px-3 py-2 text-xs text-emerald-50/75">
            Je profiel is compleet. Controleer je verificatiestatus om Discover volledig te gebruiken.
          </div>
        )}
      </div>
    </>
  );
}
