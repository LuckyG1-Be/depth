"use client";

import { MatchScoreWhy } from "@/components/MatchScoreWhy";
import SafetyMenu from "@/components/SafetyMenu";
import { DiscoverMatchConfetti } from "@/components/DiscoverMatchConfetti";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

const BG = "#1e1b27";
const GREEN = "#66b96c";
const SOFT_RED = "#e46b6b"; // pass
const SUPER_BLUE = "#4f7dff"; // superlike
const VERIFIED_BLUE = "#4f7dff";

export type DiscoverCandidate = {
  id: string;
  name: string;
  city: string;
  age: number | null;
  score: number;

  scoreBreakdown: {
    baseScore: number;
    valuesHit: number;
    passionsHit: number;
    sameCity: boolean;
    cityBoost: number;
    intentHit?: boolean;
    religionHit?: boolean;
    intentBoost?: number;
    religionBoost?: number;
    intentPenalty?: number;
    religionPenalty?: number;
  };

  photoId: string | null;

  intent: string | null;
  religion: string | null;
  values: string[];
  passions: string[];
  q: Array<{ question: string; answer: string }>;

  distanceKm?: number | null;
  isNew?: boolean;

  // ✅ verified badge
  verified?: boolean;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function VerifiedCheck({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border"
      style={{
        width: size + 10,
        height: size + 10,
        borderColor: "rgba(79,125,255,0.45)",
        background: "rgba(79,125,255,0.14)",
      }}
      title="Geverifieerd"
      aria-label="Geverifieerd"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={VERIFIED_BLUE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function ValueChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="rounded-full border px-3 py-1 text-xs sm:text-sm"
      style={{
        borderColor: "rgba(102,185,108,0.35)",
        background: "rgba(102,185,108,0.10)",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      {children}
    </span>
  );
}

function PassionChip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs sm:text-sm text-white/80">{children}</span>;
}

function MetaChip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/80 backdrop-blur">{children}</span>;
}

function GradientDivider() {
  return <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />;
}

function SkeletonPhoto() {
  return (
    <div className="h-full w-full animate-pulse p-6">
      <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="h-10 w-10 rounded-2xl bg-white/10" />
        <div className="mt-5 h-4 w-1/2 rounded-full bg-white/10" />
        <div className="mt-3 h-3 w-1/3 rounded-full bg-white/10" />
        <div className="mt-6 flex gap-2">
          <div className="h-7 w-20 rounded-full bg-white/10" />
          <div className="h-7 w-24 rounded-full bg-white/10" />
          <div className="h-7 w-16 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function SkeletonLines() {
  return (
    <div className="mt-4 animate-pulse space-y-3">
      <div className="h-3 w-4/5 rounded-full bg-white/10" />
      <div className="h-3 w-3/5 rounded-full bg-white/10" />
      <div className="h-3 w-5/6 rounded-full bg-white/10" />
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 38;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} fill="transparent" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={GREEN}
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white/90">{pct}</div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7.8L12 18.8 5.6 22 7.3 14.2 2 9.6 9 9z" />
    </svg>
  );
}

function VerifiedOnlyPill() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
      style={{
        borderColor: "rgba(79,125,255,0.35)",
        background: "rgba(79,125,255,0.10)",
        color: "rgba(255,255,255,0.92)",
      }}
      title="Je filtert op enkel geverifieerde profielen"
    >
      <VerifiedCheck size={14} />
      Verified-only
    </div>
  );
}

export default function DiscoverDeck({
  candidates,
  canSuperlike,
  seenUsedInitial,
  dailyLimit,
  verifiedOnlyActive,
}: {
  candidates: DiscoverCandidate[];
  canSuperlike: boolean;
  seenUsedInitial: number;
  dailyLimit: number;
  verifiedOnlyActive?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [seenUsed, setSeenUsed] = useState(seenUsedInitial);
  const [imgLoaded, setImgLoaded] = useState(false);

  const [showWhy, setShowWhy] = useState(false);
  const whyRef = useRef<HTMLDivElement | null>(null);

  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const qRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [anim, setAnim] = useState<{ out?: "LIKE" | "PASS" | "SUPERLIKE" } | null>(null);
  const [burst, setBurst] = useState<"LIKE" | "PASS" | "SUPERLIKE" | null>(null);

  const [fireMatch, setFireMatch] = useState(false);
  const lastActionRef = useRef<null | { idxBefore: number; seenUsedBefore: number; candidateId: string }>(null);

  const current = candidates[idx] || null;

  const title = useMemo(() => {
    if (!current) return "";
    const age = current.age ? ` · ${current.age}` : "";
    return `${current.name}${age}`;
  }, [current]);

  useEffect(() => {
    setShowWhy(false);
    setExpandedQ(null);
    setImgLoaded(false);
    setAnim(null);
    setBurst(null);
  }, [idx]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || busy) return;
      if (e.key === "ArrowLeft") void act("PASS");
      if (e.key === "ArrowRight") void act("LIKE");
      if (e.key === "ArrowUp") void act("SUPERLIKE");
      if (e.key === "?" || (e.shiftKey && e.key === "/")) setShowWhy(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, busy]);

  async function act(action: "LIKE" | "PASS" | "SUPERLIKE") {
    if (!current) return;
    if (busy) return;

    setBusy(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(action === "PASS" ? 8 : 16);

    const endpoint = action === "LIKE" ? "/api/discover/like" : action === "PASS" ? "/api/discover/pass" : "/api/discover/superlike";

    lastActionRef.current = { idxBefore: idx, seenUsedBefore: seenUsed, candidateId: current.id };

    setAnim({ out: action });
    setBurst(action);
    setTimeout(() => setBurst(null), 450);

    const advanceTimer = window.setTimeout(() => {
      setIdx((v) => v + 1);
      router.refresh();
    }, 160);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otherUserId: current.id }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || (data as any)?.ok !== true) {
        throw new Error(String((data as any)?.error || "Actie mislukt"));
      }

      setSeenUsed((v) => Math.min(dailyLimit, v + 1));

      const matchCreated = Boolean((data as any)?.matchCreated);
      if ((action === "LIKE" || action === "SUPERLIKE") && matchCreated) {
        setFireMatch(true);
        window.setTimeout(() => setFireMatch(false), 900);
        toast({ kind: "success", title: "It's a match ✨", message: "Jullie zijn gematcht. Ga naar Chats om te praten." });
      } else {
        if (action === "LIKE") toast({ kind: "success", message: "Like verstuurd" });
        if (action === "SUPERLIKE") toast({ kind: "success", message: "Superlike verstuurd" });
      }
    } catch (e: any) {
      window.clearTimeout(advanceTimer);

      const snap = lastActionRef.current;
      if (snap) {
        setIdx(snap.idxBefore);
        setSeenUsed(snap.seenUsedBefore);
      }

      const msg = String(e?.message || "Actie mislukt");
      const nice =
        msg === "DAILY_LIMIT"
          ? "Je daglimiet is bereikt. Kom morgen terug."
          : msg === "UNAUTH"
            ? "Je sessie is verlopen. Log opnieuw in."
            : msg === "RATE_LIMIT"
              ? "Te snel. Probeer binnen enkele seconden opnieuw."
              : msg;

      toast({ kind: "error", title: "Oeps", message: nice });
      setAnim(null);
    } finally {
      setTimeout(() => setBusy(false), 240);
    }
  }

  if (!current) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="text-lg font-semibold">Geen profielen meer vandaag</div>
        <div className="mt-2 text-sm text-white/70">
          Je zit aan <b>{seenUsed}</b>/{dailyLimit}. Kom morgen terug.
        </div>
        <div className="mt-6 text-xs text-white/55">Tip: morgen reset de limiet automatisch.</div>
      </div>
    );
  }

  const photoSrc = current.photoId ? `/api/photo/preview/${current.photoId}` : null;

  const cardOut =
    anim?.out === "LIKE"
      ? "translate-x-3 -rotate-1 opacity-0"
      : anim?.out === "PASS"
        ? "-translate-x-3 rotate-1 opacity-0"
        : anim?.out === "SUPERLIKE"
          ? "-translate-y-2 opacity-0"
          : "";

  const distanceLabel =
    typeof current.distanceKm === "number"
      ? `± ${Math.max(1, Math.round(current.distanceKm))} km`
      : null;

  return (
    <div className="grid gap-6 pb-48 md:pb-28">
      <DiscoverMatchConfetti fire={fireMatch} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-white/70">Vandaag gezien</div>
          <div className="text-lg font-semibold">
            {seenUsed}/{dailyLimit}
          </div>
          <div className="mt-1 text-xs text-white/55">⌨︎ ← pass • → like • ↑ super • ? waarom</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {verifiedOnlyActive ? <VerifiedOnlyPill /> : null}

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <ScoreRing score={current.score} />
            <div className="pr-1">
              <div className="text-[11px] uppercase tracking-wide text-white/60">Match</div>
              <div className="text-sm font-semibold text-white">{current.score}%</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWhy(true)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
          >
            Waarom?
          </button>
        </div>
      </div>

      {showWhy ? (
        <div ref={whyRef} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <MatchScoreWhy
            open={showWhy}
            onClose={() => setShowWhy(false)}
            score={current.score}
            baseScore={current.scoreBreakdown.baseScore}
            valuesHit={current.scoreBreakdown.valuesHit}
            passionsHit={current.scoreBreakdown.passionsHit}
            sameCity={current.scoreBreakdown.sameCity}
            cityBoost={current.scoreBreakdown.cityBoost}
            intentHit={current.scoreBreakdown.intentHit}
            religionHit={current.scoreBreakdown.religionHit}
            intentBoost={current.scoreBreakdown.intentBoost}
            religionBoost={current.scoreBreakdown.religionBoost}
            intentPenalty={current.scoreBreakdown.intentPenalty}
            religionPenalty={current.scoreBreakdown.religionPenalty}
          />
        </div>
      ) : null}

      <div
        className={cls(
          "relative overflow-hidden rounded-[28px] border border-white/10",
          "bg-gradient-to-b from-white/10 to-white/5 shadow-[0_12px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10",
          "transition-all duration-200",
          cardOut
        )}
      >
        {burst ? <ActionBurst kind={burst} /> : null}

        <div className="relative h-[min(58vh,480px)] min-h-[300px] w-full bg-black/20 sm:h-[300px]">
          <div className="absolute right-4 top-4 z-30">
            <span className="sr-only">Veiligheid voor dit profiel</span>
            <SafetyMenu otherUserId={current.id} context="discover" />
          </div>

          {photoSrc ? (
            <>
              {!imgLoaded ? (
                <div className="absolute inset-0">
                  <SkeletonPhoto />
                </div>
              ) : null}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc}
                alt=""
                onLoad={() => setImgLoaded(true)}
                className={cls("absolute inset-0 h-full w-full object-cover blur-[1px] transition-opacity duration-200", !imgLoaded && "opacity-0")}
              />

              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 to-transparent" />
            </>
          ) : (
            <SkeletonPhoto />
          )}

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm backdrop-blur">
              <span className="opacity-90">🔒 Foto’s pas na unlock</span>
            </div>

            {current.isNew ? (
              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-50 backdrop-blur">
                NIEUW
              </div>
            ) : null}

            {distanceLabel ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/85 backdrop-blur">
                {distanceLabel}
              </div>
            ) : null}

            {current.verified ? (
              <div className="ml-1">
                <VerifiedCheck size={14} />
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="relative inline-block rounded-3xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <div className="text-[26px] leading-tight font-semibold text-white">{title}</div>
                {current.verified ? <VerifiedCheck size={16} /> : null}
              </div>
              <div className="mt-1 text-sm text-white/75">{current.city}</div>

              <div className="mt-2 flex flex-wrap gap-2">
                {current.intent ? <MetaChip>{current.intent}</MetaChip> : null}
                {current.religion ? <MetaChip>{current.religion}</MetaChip> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          {!imgLoaded ? <SkeletonLines /> : null}

          <GradientDivider />

          <div className="grid gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/55">Waarden</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {current.values.map((v, i) => (
                  <ValueChip key={`${v}-${i}`}>{v}</ValueChip>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/55">Passies</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {current.passions.map((p, i) => (
                  <PassionChip key={`${p}-${i}`}>{p}</PassionChip>
                ))}
              </div>
            </div>
          </div>

          <GradientDivider />

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/55">Depth vragen</div>

            <div className="mt-3 grid gap-3">
              {current.q.map((qa, i) => {
                const open = expandedQ === i;

                return (
                  <button
                    key={i}
                    ref={(el) => {
                      qRefs.current[i] = el;
                    }}
                    type="button"
                    onClick={() => {
                      setExpandedQ(open ? null : i);
                      setTimeout(() => {
                        qRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 0);
                    }}
                    className="text-left rounded-3xl border border-white/10 bg-black/18 p-4 hover:bg-black/25 transition"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-white/60">{qa.question}</div>

                    <div className={cls("mt-2 text-[15px] leading-relaxed text-white/92", !open && "line-clamp-2")}>
                      <span className="mr-2 text-white/60">“</span>
                      {qa.answer}
                      <span className="ml-2 text-white/60">”</span>
                    </div>

                    <div className="mt-3 text-xs text-white/60">{open ? "Minder" : "Meer"}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 text-xs text-white/55">Foto blijft bewust geblurd tot chat-unlock.</div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-20 z-40 border-t border-white/10 backdrop-blur md:bottom-0" style={{ backgroundColor: "rgba(30,27,39,0.96)" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4">
          <div className="flex gap-3">
            <IconPill tone="pass" label="Overslaan" onClick={() => void act("PASS")} disabled={busy} icon={<XIcon />} />
            <IconPill tone="like" label="Like" onClick={() => void act("LIKE")} disabled={busy} icon={<HeartIcon />} />
            <IconPill
              tone="super"
              label="Superlike"
              hint={canSuperlike ? undefined : "1/week"}
              onClick={() => void act("SUPERLIKE")}
              disabled={busy || !canSuperlike}
              icon={<StarIcon />}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          background: ${BG};
        }
      `}</style>
    </div>
  );
}

function IconPill({
  label,
  onClick,
  disabled,
  tone,
  icon,
  hint,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone: "like" | "super" | "pass";
  icon: ReactNode;
  hint?: string;
}) {
  const base =
    "h-16 flex-1 rounded-3xl px-5 text-sm font-semibold transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100";

  const style =
    tone === "pass"
      ? { backgroundColor: "rgba(228,107,107,0.18)", color: "rgba(255,255,255,0.92)" }
      : tone === "like"
        ? { backgroundColor: GREEN, color: "#0b1a10" }
        : disabled
          ? { backgroundColor: "rgba(79,125,255,0.10)", borderColor: "rgba(79,125,255,0.35)", borderWidth: 2, color: "rgba(255,255,255,0.85)" }
          : { backgroundColor: "rgba(79,125,255,0.18)", borderColor: SUPER_BLUE, borderWidth: 2, color: "rgba(255,255,255,0.95)" };

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={base} style={style as any}>
      <div className="flex items-center justify-center gap-3">
        <span className="inline-flex">{icon}</span>
        <span>{label}</span>
      </div>
      {hint ? <div className="mt-0.5 text-[11px] font-medium opacity-80">{hint}</div> : null}
    </button>
  );
}

function ActionBurst({ kind }: { kind: "LIKE" | "PASS" | "SUPERLIKE" }) {
  const text = kind === "LIKE" ? "LIKE" : kind === "PASS" ? "PASS" : "SUPER";
  const color = kind === "LIKE" ? GREEN : kind === "PASS" ? SOFT_RED : SUPER_BLUE;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className="rounded-3xl border px-6 py-3 text-sm font-bold tracking-widest"
        style={{
          borderColor: `${color}66`,
          background: "rgba(0,0,0,0.35)",
          color,
          transform: "translateY(-10px)",
          animation: "pop 420ms ease-out forwards",
        }}
      >
        {text}
      </div>

      <style jsx>{`
        @keyframes pop {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.92);
          }
          35% {
            opacity: 1;
            transform: translateY(-6px) scale(1.02);
          }
          100% {
            opacity: 0;
            transform: translateY(-18px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
