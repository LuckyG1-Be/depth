import { Card } from "@/components/Card";
import { cn } from "@/components/ui";

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("depth-skeleton h-4", className)} />;
}

export function SkeletonCard({ lines = 4, className }: { lines?: number; className?: string }) {
  return (
    <Card className={cn("space-y-3", className)}>
      <SkeletonLine className="h-5 w-36" />
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine key={index} className={index === lines - 1 ? "w-2/3" : "w-full"} />
      ))}
    </Card>
  );
}

export function PageSkeleton({ title = "Laden" }: { title?: string }) {
  return (
    <main className="depth-page">
      <div className="mb-5">
        <div className="depth-eyebrow">{title}</div>
        <SkeletonLine className="mt-3 h-8 w-52 rounded-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={5} />
      </div>
      <SkeletonCard lines={6} className="mt-4" />
    </main>
  );
}
