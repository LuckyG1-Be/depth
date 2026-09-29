import type { ReactNode } from "react";

export default function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">{children}</span>;
}
