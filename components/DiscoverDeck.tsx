"use client";

import { MatchScoreWhy } from "@/components/MatchScoreWhy";
import EmptyStateCard from "@/components/EmptyStateCard";
import { DiscoverMatchConfetti } from "@/components/DiscoverMatchConfetti";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { DiscoverActionDock, DiscoverCandidateCard } from "@/components/discover/DiscoverDeckUi";
import type { DiscoverAction, DiscoverActionResponse, DiscoverCandidate } from "@/components/discover/DiscoverDeckTypes";

export type { DiscoverCandidate } from "@/components/discover/DiscoverDeckTypes";

const BG = "#1e1b27";

const MIN_ACTION_ANIMATION_MS = 260;
const TRANSITION_CLEAR_MS = 620;
const SETTLE_AFTER_ADVANCE_MS = 90;
const GLOBAL_ACTION_LOCK_MS = 620;
const GLOBAL_ACTION_LOCK_STORAGE_KEY = "depth:discover-action-locked-until";

let globalActionLockedUntil = 0;


function getGlobalActionLockedUntil() {
  if (typeof window === "undefined") return globalActionLockedUntil;
  const stored = Number(window.sessionStorage.getItem(GLOBAL_ACTION_LOCK_STORAGE_KEY) || "0");
  return Math.max(globalActionLockedUntil, Number.isFinite(stored) ? stored : 0);
}

function setGlobalActionLock(ms: number) {
  const until = Date.now() + ms;
  globalActionLockedUntil = until;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(GLOBAL_ACTION_LOCK_STORAGE_KEY, String(until));
  }
  return until;
}

function clearGlobalActionLockIfExpired() {
  if (typeof window === "undefined") return;
  const until = getGlobalActionLockedUntil();
  if (until <= Date.now()) {
    window.sessionStorage.removeItem(GLOBAL_ACTION_LOCK_STORAGE_KEY);
    globalActionLockedUntil = 0;
  }
}

function clearGlobalActionLock() {
  globalActionLockedUntil = 0;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(GLOBAL_ACTION_LOCK_STORAGE_KEY);
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function newActionId(action: DiscoverAction, candidateId: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${action}:${candidateId}:${Date.now()}:${random}`;
}

type NavigatorWithVibrate = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

function vibrate(ms: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const nav = navigator as NavigatorWithVibrate;
      nav.vibrate?.(ms);
    }
  } catch {}
}

function getActionEndpoint(action: DiscoverAction) {
  if (action === "LIKE") return "/api/discover/like";
  if (action === "PASS") return "/api/discover/pass";
  return "/api/discover/superlike";
}

function getActionErrorMessage(error: string) {
  return error === "DAILY_LIMIT"
    ? "Je daglimiet is bereikt. Kom morgen terug."
    : error === "LIKE_LIMIT"
      ? "Je like-limiet is bereikt."
      : error === "MATCH_LIMIT" || error === "MATCH_SLOTS_FULL"
        ? "Je match-slots zijn vol. De match wordt bewaard zodra er plaats is."
        : error === "SUPERLIKE_LIMIT"
          ? "Je Dieptesignaal is al gebruikt. Je krijgt er wekelijks één."
          : error === "NOT_VERIFIED"
            ? "Je profiel moet eerst geverifieerd zijn."
            : error === "PROFILE_INCOMPLETE"
              ? "Vul eerst je profiel volledig aan."
              : error === "UNAUTH"
                ? "Je sessie is verlopen. Log opnieuw in."
                : error === "RATE_LIMIT"
                  ? "Te snel. Probeer binnen enkele seconden opnieuw."
                  : error;
}

function getCardAnimation(action?: DiscoverAction) {
  return action === "LIKE"
    ? "translate-x-[115%] rotate-6 opacity-0 scale-[0.96]"
    : action === "PASS"
      ? "-translate-x-[115%] -rotate-6 opacity-0 scale-[0.96]"
      : action === "SUPERLIKE"
        ? "-translate-y-14 opacity-0 scale-[0.94]"
        : "";
}

function getTransitionCopy(action: DiscoverAction) {
  if (action === "LIKE") return { title: "Like verstuurd", tone: "like" as const };
  if (action === "PASS") return { title: "Overgeslagen", tone: "pass" as const };
  return { title: "Depth verstuurd", tone: "super" as const };
}

function DiscoverTransitionOverlay({ action }: { action: DiscoverAction | null }) {
  if (!action) return null;
  const copy = getTransitionCopy(action);
  return (
    <div className={`depth-profile-transition depth-profile-transition-${copy.tone}`} aria-live="polite">
      <div className="depth-profile-transition-card">
        <img src="/depth-logo.svg" alt="Depth" className="h-16 w-auto" />
        <div className="mt-2 text-sm font-semibold tracking-wide text-white/86">{copy.title}</div>
      </div>
    </div>
  );
}

export default function DiscoverDeck({
  candidates,
  canSuperlike,
  seenUsedInitial,
  dailyLimit,
  myValues,
  myPassions,
}: {
  candidates: DiscoverCandidate[];
  canSuperlike: boolean;
  seenUsedInitial: number;
  dailyLimit: number;
  myValues?: string[];
  myPassions?: string[];
  verifiedOnlyActive?: boolean;
}) {
  const { toast } = useToast();

  const [idx, setIdx] = useState(0);
  const [visibleCandidates, setVisibleCandidates] = useState<DiscoverCandidate[]>(candidates);
  const [busy, setBusy] = useState(false);
  const [seenUsed, setSeenUsed] = useState(seenUsedInitial);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [anim, setAnim] = useState<{ out?: DiscoverAction } | null>(null);
  const [burst, setBurst] = useState<DiscoverAction | null>(null);
  const [fireMatch, setFireMatch] = useState(false);
  const [transitionAction, setTransitionAction] = useState<DiscoverAction | null>(null);

  const qRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const deckTopRef = useRef<HTMLDivElement | null>(null);
  const actionInFlightRef = useRef(false);
  const currentActionIdRef = useRef<string | null>(null);
  const activeCandidateIdRef = useRef<string | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<number | null>(null);
  const handledCandidateIdsRef = useRef<Set<string>>(new Set());
  const current = visibleCandidates[idx] || null;

  useEffect(() => {
    setVisibleCandidates(candidates.filter((candidate) => !handledCandidateIdsRef.current.has(candidate.id)));
    setIdx(0);
  }, [candidates]);

  useEffect(() => {
    activeCandidateIdRef.current = current?.id ?? null;
  }, [current?.id]);

  const myValuesSet = useMemo(() => new Set((myValues || []).map((x) => String(x))), [myValues]);
  const myPassionsSet = useMemo(() => new Set((myPassions || []).map((x) => String(x))), [myPassions]);

  const title = useMemo(() => {
    if (!current) return "";
    const age = current.age ? ` · ${current.age}` : "";
    return `${current.name}${age}`;
  }, [current]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
      if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setShowWhy(false);
    setExpandedQ(null);
    setImgLoaded(false);
    setAnim(null);
    setBurst(null);
    window.requestAnimationFrame(() => {
      deckTopRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [current?.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || busy) return;
      if (e.key === "ArrowLeft") void act("PASS");
      if (e.key === "ArrowRight") void act("LIKE");
      // Dieptesignaal gebeurt bewust via de centrale knop, niet via up-swipe/keyboard.
      if (e.key === "Escape") setShowWhy(false);
      if (e.key === "?" || (e.shiftKey && e.key === "/")) setShowWhy(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, busy]);

  async function act(action: DiscoverAction) {
    clearGlobalActionLockIfExpired();
    if (!current || busy || actionInFlightRef.current || getGlobalActionLockedUntil() > Date.now()) return;

    if (action === "SUPERLIKE" && !canSuperlike) {
      toast({ kind: "error", title: "Depth gebruikt", message: "Je krijgt wekelijks één nieuw Depth-signaal." });
      return;
    }

    const candidate = current;
    const seenUsedBefore = seenUsed;
    const actionId = newActionId(action, candidate.id);
    let advancedToNextCandidate = false;

    actionInFlightRef.current = true;
    currentActionIdRef.current = actionId;
    setGlobalActionLock(GLOBAL_ACTION_LOCK_MS);

    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);

    setBusy(true);
    setAnim({ out: action });
    setBurst(action);
    setTransitionAction(action);

    advanceTimerRef.current = window.setTimeout(() => {
      if (currentActionIdRef.current === actionId) setBurst(null);
      advanceTimerRef.current = null;
    }, 720);

    if (action === "LIKE") vibrate(12);
    if (action === "PASS") vibrate(10);
    if (action === "SUPERLIKE") vibrate([10, 35, 10]);

    try {
      const request = fetch(getActionEndpoint(action), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otherUserId: candidate.id, idemKey: actionId }),
      });

      await delay(MIN_ACTION_ANIMATION_MS);

      if (currentActionIdRef.current !== actionId) return;

      // Show the next profile quickly, but keep the action buttons locked until the server confirms.
      handledCandidateIdsRef.current.add(candidate.id);
      setVisibleCandidates((value) => value.filter((item) => item.id !== candidate.id));
      setIdx(0);
      advancedToNextCandidate = true;

      const res = await request;
      const data = (await res.json().catch(() => ({}))) as DiscoverActionResponse;
      if (!res.ok || data.ok !== true) {
        throw new Error(String(data.error || "Actie mislukt"));
      }

      if (currentActionIdRef.current !== actionId) return;

      if (typeof data.seenUsed === "number") {
        setSeenUsed(Math.max(0, Math.min(dailyLimit, data.seenUsed)));
      } else {
        setSeenUsed((v) => Math.min(dailyLimit, v + 1));
      }

      const matchCreated = Boolean(data?.matchCreated);
      const queuedMatch = Boolean(data?.queuedMatch);
      if ((action === "LIKE" || action === "SUPERLIKE") && matchCreated) {
        setFireMatch(true);
        window.setTimeout(() => setFireMatch(false), 900);
        vibrate([18, 25, 18, 45, 25]);
        toast({ kind: "success", title: "Match ✨", message: "Jullie kozen allebei voor diepgang. Zeg hallo in Chat." });
      } else if ((action === "LIKE" || action === "SUPERLIKE") && queuedMatch) {
        toast({
          kind: "success",
          title: "Match staat klaar",
          message: "Jullie match is wederzijds, maar wacht tot er een match-slot vrij is.",
        });
      } else {
        if (action === "LIKE") toast({ kind: "success", message: "Like verstuurd" });
        if (action === "SUPERLIKE") toast({ kind: "success", message: "Depth verstuurd" });
      }

      try {
        window.dispatchEvent(new Event("depth:notifications-changed"));
        if (matchCreated || queuedMatch) window.dispatchEvent(new Event("depth:threads-changed"));
      } catch {}

      transitionTimerRef.current = window.setTimeout(() => {
        if (currentActionIdRef.current === actionId) setTransitionAction(null);
        transitionTimerRef.current = null;
      }, TRANSITION_CLEAR_MS);

      releaseTimerRef.current = window.setTimeout(() => {
        if (currentActionIdRef.current === actionId) {
          actionInFlightRef.current = false;
          currentActionIdRef.current = null;
          setBusy(false);
          clearGlobalActionLock();
        }
        releaseTimerRef.current = null;
      }, SETTLE_AFTER_ADVANCE_MS);
    } catch (e: any) {
      if (currentActionIdRef.current !== actionId) return;

      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }

      if (advancedToNextCandidate) {
        handledCandidateIdsRef.current.delete(candidate.id);
        setVisibleCandidates((value) => [candidate, ...value.filter((item) => item.id !== candidate.id)]);
        setIdx(0);
      }
      setSeenUsed(seenUsedBefore);

      const msg = String(e?.message || "Actie mislukt");
      toast({ kind: "error", title: "Oeps", message: getActionErrorMessage(msg) });
      setAnim(null);
      setBurst(null);
      setTransitionAction(null);
      actionInFlightRef.current = false;
      currentActionIdRef.current = null;
      setBusy(false);
      clearGlobalActionLock();
    }
  }


  if (!current) {
    const limitReached = seenUsed >= dailyLimit;
    return (
      <EmptyStateCard
        eyebrow={limitReached ? "Daglimiet bereikt" : "Geen profielen gevonden"}
        title={limitReached ? "Je hebt alle profielen voor vandaag gezien" : "Er zijn nu geen passende profielen"}
        description={
          limitReached
            ? `Je zit aan ${seenUsed}/${dailyLimit}. Morgen staan er nieuwe profielen klaar.`
            : "Er zijn nu geen profielen binnen je voorkeuren. Verruim je filters of kijk later opnieuw."
        }
        tips={
          limitReached
            ? ["Morgen nieuw aanbod", "Bekijk je likes", "Praat verder"]
            : ["Vergroot afstand", "Verruim leeftijd", "Check verified-only"]
        }
        actions={[
          { href: "/profile/preferences", label: "Voorkeuren aanpassen", primary: true },
          { href: "/likes", label: "Likes bekijken" },
          { href: "/chat", label: "Naar chats" },
        ]}
      />
    );
  }

  const photoSrc = current.photoId ? `/api/photo/preview/${current.photoId}?w=900&blur=18` : null;
  const cardOut = getCardAnimation(anim?.out);
  const distanceKm = typeof current.distanceKm === "number" ? Math.max(1, Math.round(current.distanceKm)) : null;
  const cityLine = distanceKm ? `${current.city} (${distanceKm} km van jou vandaan)` : current.city;

  return (
    <div ref={deckTopRef} className="grid gap-2.5 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:gap-6 md:pb-8">
      <DiscoverMatchConfetti fire={fireMatch} />
      <DiscoverTransitionOverlay action={transitionAction} />

      <div className="depth-card p-2.5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="hidden depth-eyebrow sm:block">Vandaag</div>
            <div className="text-sm text-white/66 sm:mt-1">
              <span className="font-semibold text-white">{Math.max(0, dailyLimit - seenUsed)}</span> profielen over
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/18 px-2.5 py-1.5 text-right text-xs font-semibold text-white sm:px-3 sm:py-2 sm:text-sm">{seenUsed}/{dailyLimit}</div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25 sm:mt-3 sm:h-2">
          <div className="h-full rounded-full bg-emerald-300" style={{ width: `${Math.min(100, Math.round((seenUsed / Math.max(1, dailyLimit)) * 100))}%` }} />
        </div>
      </div>

      <MatchScoreWhy
        open={showWhy}
        onClose={() => setShowWhy(false)}
        score={current.score}
        baseline={current.scoreBreakdown.baseline ?? 45}
        valuesHit={current.scoreBreakdown.valuesHit}
        passionsHit={current.scoreBreakdown.passionsHit}
        valuesPoints={current.scoreBreakdown.valuesPoints}
        passionsPoints={current.scoreBreakdown.passionsPoints}
        qaSimilarityPct={current.scoreBreakdown.qaSimilarityPct}
        qaPoints={current.scoreBreakdown.qaPoints}
        sameCity={current.scoreBreakdown.sameCity}
        cityBoost={current.scoreBreakdown.cityBoost}
        distancePoints={current.scoreBreakdown.distancePoints}
        intentHit={current.scoreBreakdown.intentHit}
        religionHit={current.scoreBreakdown.religionHit}
        intentBoost={current.scoreBreakdown.intentBoost}
        religionBoost={current.scoreBreakdown.religionBoost}
        intentPenalty={current.scoreBreakdown.intentPenalty}
        religionPenalty={current.scoreBreakdown.religionPenalty}
        lifestylePoints={current.scoreBreakdown.lifestylePoints}
        activityPoints={current.scoreBreakdown.activityPoints}
        qualityPoints={current.scoreBreakdown.qualityPoints}
        reasons={current.matchReasons || []}
      />

      <div>
        <DiscoverCandidateCard
          current={current}
          title={title}
          cityLine={cityLine}
          photoSrc={photoSrc}
          imgLoaded={imgLoaded}
          onImageLoad={() => setImgLoaded(true)}
          cardOut={cardOut}
          burst={burst}
          busy={busy}
          myValuesSet={myValuesSet}
          myPassionsSet={myPassionsSet}
          expandedQ={expandedQ}
          setExpandedQ={setExpandedQ}
          qRefs={qRefs}
          onWhy={() => setShowWhy(true)}
          canSuperlike={canSuperlike}
          onAction={(action) => void act(action)}
        />
      </div>

      <DiscoverActionDock busy={busy} canSuperlike={canSuperlike} onAction={(action) => void act(action)} />

      <style jsx global>{`
        body {
          background: ${BG};
        }
      `}</style>
    </div>
  );
}
