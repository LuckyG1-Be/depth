import Chip from "./Chip";
import type { ChatOther } from "./types";
import { cls } from "./utils";

type Props = {
  other: ChatOther;
  locked: boolean;
  remaining: number;
  unlockTotal: number;
  isArchived: boolean;
  isUnlocked: boolean;
  unlockedThumbs: string[];
  setModalSrc: (src: string) => void;
};

function PhotoStatus({ isUnlocked }: { isUnlocked: boolean }) {
  return (
    <span className={cls(
      "rounded-full border px-2.5 py-1 text-xs",
      isUnlocked ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-black/20 text-white/58"
    )}>
      {isUnlocked ? "Zichtbaar" : "Verborgen"}
    </span>
  );
}

export default function MatchSidebar({ other, locked, remaining, unlockTotal, isArchived, isUnlocked, unlockedThumbs, setModalSrc }: Props) {
  return (
    <aside className="lg:col-span-4">
      <div className="depth-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="depth-eyebrow">Matchprofiel</div>
            <h2 className="mt-1 text-lg font-semibold text-white">{other.name}</h2>
          </div>
          {isArchived ? <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-100">Archief</span> : null}
        </div>

        {other.values?.length ? (
          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Waarden</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {other.values.slice(0, 8).map((v) => (
                <Chip key={v}>{v}</Chip>
              ))}
            </div>
          </div>
        ) : null}

        {other.passions?.length ? (
          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Passies</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {other.passions.slice(0, 8).map((p) => (
                <Chip key={p}>{p}</Chip>
              ))}
            </div>
          </div>
        ) : null}

        {other.qa?.length ? (
          <details className="mt-5 rounded-2xl border border-white/10 bg-black/14">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white/76">Depth-antwoorden</summary>
            <div className="space-y-3 px-4 pb-4">
              {other.qa.slice(0, 5).map((x, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-xs font-semibold text-white/58">{x.q}</div>
                  <div className="mt-1 text-sm leading-6 text-white/82">{x.a}</div>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      <div className="depth-card mt-5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/82">Foto’s</div>
            <div className="mt-0.5 text-xs text-white/48">{isUnlocked ? "Bekijk de galerij" : "Nog verborgen"}</div>
          </div>
          <PhotoStatus isUnlocked={isUnlocked} />
        </div>

        {!isUnlocked ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/14 p-3 text-sm text-white/62">
            De galerij verschijnt zodra jullie gesprek voldoende op gang is.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {unlockedThumbs.map((src) => (
              <button key={src} onClick={() => setModalSrc(src)} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 hover:border-emerald-400/25" title="Open foto" type="button">
                <img src={src} alt="" className="h-24 w-full object-cover sm:h-28" />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
