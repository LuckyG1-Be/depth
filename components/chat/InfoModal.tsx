import type { ReactNode } from "react";
import type { ChatOther } from "./types";
import UnlockPipsSmall from "./UnlockPipsSmall";

type Props = {
  open: boolean;
  onClose: () => void;
  other: ChatOther;
  locked: boolean;
  remaining: number;
  unlockTotal: number;
  isUnlocked: boolean;
  unlockedThumbs: string[];
  setModalSrc: (value: string | null) => void;
};

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/76">{children}</span>;
}

function QuestionCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/16 px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">{q}</div>
      <div className="mt-1 line-clamp-3 text-sm leading-6 text-white/82">“ {a} ”</div>
    </div>
  );
}

export default function InfoModal({ open, onClose, other, locked, remaining, unlockTotal, isUnlocked, unlockedThumbs, setModalSrc }: Props) {
  if (!open) return null;
  const done = Math.max(0, unlockTotal - remaining);

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 px-3 pb-3 sm:items-center sm:pb-0" onClick={onClose}>
      <div className="relative max-h-[86dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/10 bg-[#1e1b27] p-4 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">{other.name}</div>
            <div className="mt-1 text-sm text-white/55">
              {other.age ? `${other.age}j` : ""}{other.age && other.city ? " · " : ""}{other.city}
            </div>
          </div>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/70" type="button" aria-label="Sluiten">
            ×
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-300/18 bg-emerald-400/10 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-emerald-50">{isUnlocked ? "Foto’s zichtbaar" : "Foto’s verborgen"}</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/20 px-2.5 py-1 text-xs text-white/78">
              <UnlockPipsSmall total={unlockTotal} remaining={remaining} isUnlocked={isUnlocked} />
              <span>{isUnlocked ? "open" : `${done}/${unlockTotal}`}</span>
            </div>
          </div>
          {!isUnlocked ? <p className="mt-2 text-xs leading-5 text-white/58">Foto’s worden zichtbaar na 5 afwisselende replies.</p> : null}
        </div>

        {unlockedThumbs.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {unlockedThumbs.slice(0, 6).map((src) => (
              <button key={src} type="button" onClick={() => setModalSrc(src)} className="aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {other.intent ? <Chip>{other.intent}</Chip> : null}
          {other.religion ? <Chip>{other.religion}</Chip> : null}
          {other.values.slice(0, 5).map((value) => <Chip key={`v-${value}`}>{value}</Chip>)}
          {other.passions.slice(0, 5).map((value) => <Chip key={`p-${value}`}>{value}</Chip>)}
        </div>

        {other.qa.length > 0 ? (
          <div className="mt-4 space-y-2">
            {other.qa.slice(0, 4).map((item) => <QuestionCard key={item.q} q={item.q} a={item.a} />)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
