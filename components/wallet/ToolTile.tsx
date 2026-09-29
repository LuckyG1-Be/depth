import type { ReactNode } from "react";

export default function ToolTile({
  title,
  cost,
  note,
  description,
  icon,
  badge,
  activeText,
  footerText,
  children,
}: {
  title: string;
  cost: number;
  note?: string | null;
  description?: string | null;
  icon: ReactNode;
  badge?: string | null;
  activeText?: string | null;
  footerText?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">{icon}</span>

        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-white/80">
            {cost} token{cost === 1 ? "" : "s"}
          </div>

          {badge ? <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-100">{badge}</div> : null}
        </div>
      </div>

      <div className="mt-3 text-sm font-semibold text-white/90">{title}</div>
      {description ? <div className="mt-1 text-xs leading-5 text-white/60">{description}</div> : null}
      {note ? <div className="mt-2 text-xs leading-5 text-white/42">{note}</div> : null}

      {activeText ? <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[11px] leading-5 text-emerald-50/90">{activeText}</div> : null}

      <div className="mt-auto">
        {children ? <div className="mt-4">{children}</div> : null}
        {footerText ? <div className="mt-3 text-[11px] leading-5 text-white/42">{footerText}</div> : null}
      </div>
    </div>
  );
}
