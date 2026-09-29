"use client";

type Props = {
  education?: string | null;
  drinking?: string | null;
  smoking?: string | null;
  exercise?: string | null;
  onReset?: () => void;
};

function chip(label: string) {
  return (
    <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-50">
      {label}
    </div>
  );
}

export default function ActiveFiltersBar({
  education,
  drinking,
  smoking,
  exercise,
  onReset,
}: Props) {
  const active = [
    education && `🎓 ${education}`,
    drinking && `🍷 ${drinking}`,
    smoking && `🚭 ${smoking}`,
    exercise && `🏃 ${exercise}`,
  ].filter(Boolean) as string[];

  if (!active.length) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs font-semibold opacity-70">Filters actief:</div>

      {active.map((a) => (
        <div key={a}>{chip(a)}</div>
      ))}

      {onReset && (
        <button
          onClick={onReset}
          className="ml-2 rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/10"
        >
          reset
        </button>
      )}
    </div>
  );
}
