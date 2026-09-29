import Link from "next/link";

type Action = {
  href: string;
  label: string;
  primary?: boolean;
};

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  tips?: string[];
  actions?: Action[];
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function EmptyStateCard({ eyebrow, title, description, tips = [], actions = [] }: Props) {
  return (
    <div className="depth-card p-3.5 text-white sm:p-6">
      {eyebrow ? <div className="depth-eyebrow text-emerald-100/65">{eyebrow}</div> : null}
      <h2 className="mt-1 text-base font-semibold tracking-[-0.01em] text-white sm:mt-2 sm:text-xl">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-white/62 sm:mt-2 sm:text-sm sm:leading-6">{description}</p>

      {tips.length ? (
        <div className="mt-3 grid gap-1.5 sm:mt-5 sm:grid-cols-3 sm:gap-2">
          {tips.map((tip) => (
            <div key={tip} className="rounded-2xl border border-white/10 bg-black/15 px-3 py-1.5 text-[13px] text-white/68 sm:px-4 sm:py-3 sm:text-sm">
              {tip}
            </div>
          ))}
        </div>
      ) : null}

      {actions.length ? (
        <div className="mt-3 grid gap-2 sm:mt-5 sm:flex sm:flex-wrap">
          {actions.map((action) => (
            <Link
              key={`${action.href}:${action.label}`}
              href={action.href}
              className={cls(
                "inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] sm:min-h-11 sm:py-2.5",
                action.primary
                  ? "border border-emerald-300/20 bg-emerald-400 text-[#102016] hover:bg-emerald-300"
                  : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
