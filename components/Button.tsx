import React from "react";
import { cn } from "./ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export function Button({ className, variant = "primary", fullWidth = false, ...props }: Props) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55";

  const styles: Record<Variant, string> = {
    primary: "border border-emerald-300/20 bg-emerald-400 text-[#102016] hover:bg-emerald-300",
    secondary: "border border-white/10 bg-white/5 text-white/85 hover:bg-white/10",
    ghost: "border border-transparent bg-transparent text-white/68 hover:bg-white/5 hover:text-white",
    danger: "border border-red-300/25 bg-red-400/12 text-red-50 hover:bg-red-400/18",
  };

  return <button className={cn(base, styles[variant], fullWidth && "w-full", className)} {...props} />;
}
