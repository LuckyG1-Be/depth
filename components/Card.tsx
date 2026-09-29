import React from "react";
import { cn } from "./ui";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("depth-card p-4 sm:p-5", className)} {...props} />;
}
