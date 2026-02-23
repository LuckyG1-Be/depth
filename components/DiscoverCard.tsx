"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Candidate = {
  id: string;
  name: string;
  city: string;
  age: number | null;
  score: number;

  photoId?: string | null;

  values: string[];
  passions: string[];
  intent?: string | null;
  religion?: string | null;

  qPreview?: string[];
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
      {children}
    </span>
  );
}

export function DiscoverCard({
  candidate,
  canSuperlike,
}: {
  candidate: Candidate;
  canSuperlike: boolean;
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(action: "LIKE" | "PASS" | "SUPERLIKE") {
    setErr(null);
    setBusy(true);
    try {
      const endpoint =
        action === "LIKE" ? "/api/discover/like" : action === "PASS" ? "/api/discover/pass" : "/api/discover/superlike";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otherUserId: candidate.id }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok !== true) throw new Error(data?.error || "Actie mislukt");

      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Actie mislukt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      {err ? (
        <div className="mb-4 rounded-2xl border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">
            {candidate.name}
            {candidate.age ? <span className="text-white/70"> · {candidate.age}</span> : null}
          </div>
          <div className="mt-1 text-sm text-white/70">{candidate.city}</div>
          <div className="mt-2 text-sm text-white/80">
            Matchscore: <span className="font-semibold text-white">{candidate.score}%</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {candidate.intent ? <Chip>{candidate.intent}</Chip> : null}
            {candidate.religion ? <Chip>{candidate.religion}</Chip> : null}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => act("PASS")}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
          >
            Overslaan
          </button>

          <button
            disabled={busy}
            onClick={() => act("LIKE")}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
          >
            Like
          </button>

          <button
            disabled={busy || !canSuperlike}
            onClick={() => act("SUPERLIKE")}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
          >
            Superlike
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        {candidate.photoId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/photo/${candidate.photoId}`} alt="" className="h-[520px] w-full object-cover" />
        ) : (
          <div className="flex h-[520px] items-center justify-center text-sm text-white/50">Geen foto</div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.values.slice(0, 10).map((v) => (
          <Chip key={v}>{v}</Chip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {candidate.passions.slice(0, 10).map((p) => (
          <Chip key={p}>{p}</Chip>
        ))}
      </div>

      {candidate.qPreview?.length ? (
        <div className="mt-4 grid gap-2">
          {candidate.qPreview.slice(0, 3).map((t, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
              {t}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}



