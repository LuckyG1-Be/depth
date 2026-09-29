import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function BackLink({ href, label = "Terug", className }: { href: string; label?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/68 transition hover:bg-white/10 hover:text-white active:scale-[0.98]",
        className
      )}
    >
      ← {label}
    </Link>
  );
}

export function PageHeader({ eyebrow, title, subtitle, backHref, backLabel, actions, compact = false, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-3 flex flex-col gap-2.5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-4", className)}>
      <div className="min-w-0">
        {backHref ? <BackLink href={backHref} label={backLabel} className="mb-3" /> : null}
        {eyebrow ? <div className="depth-eyebrow">{eyebrow}</div> : null}
        <h1 className={cn("depth-title", compact ? "text-[1.18rem] sm:text-2xl" : "")}>{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-[13px] leading-5 text-white/58 sm:mt-2 sm:text-sm sm:leading-6">{subtitle}</p> : null}
      </div>
      {actions ? <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">{actions}</div> : null}
    </header>
  );
}

export function PageActionLink({ href, children, variant = "secondary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "danger" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
        variant === "primary" && "border border-emerald-300/20 bg-emerald-400 text-[#102016] hover:bg-emerald-300",
        variant === "secondary" && "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
        variant === "danger" && "border border-red-300/25 bg-red-400/12 text-red-50 hover:bg-red-400/18"
      )}
    >
      {children}
    </Link>
  );
}
