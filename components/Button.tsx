import React from "react";
import { cn } from "./ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, variant = "primary", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed";

  const styles: Record<Variant, string> = {
    primary: "bg-white text-zinc-900 hover:bg-zinc-200",
    secondary: "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 border border-zinc-800",
    ghost: "bg-transparent text-zinc-100 hover:bg-zinc-900 border border-zinc-800",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };

  return <button className={cn(base, styles[variant], className)} {...props} />;
}
