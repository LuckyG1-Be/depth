import React from "react";
import { cn } from "./ui";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-sm backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
