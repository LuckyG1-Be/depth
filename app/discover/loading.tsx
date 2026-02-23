import { Card } from "@/components/Card";

export default function LoadingDiscover() {
  return (
    <div className="grid gap-4">
      <Card>
        <div className="h-6 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-zinc-800" />
      </Card>
      <Card>
        <div className="h-6 w-56 animate-pulse rounded bg-zinc-800" />
        <div className="mt-4 grid gap-2">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
        </div>
      </Card>
    </div>
  );
}
