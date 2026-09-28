"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Thread = {
  matchId: string;
  otherUserId: string;
  otherName: string;
  otherCity: string;

  isUnlocked: boolean;
  unlockedAt: string | null;

  isArchived?: boolean;
  archivedAt?: string | null;

  otherFirstPhotoId: string | null;

  lastMessageText: string | null;
  lastMessageAt: string | null;
  lastMessageFromOther: boolean;

  unreadCount: number;
  hasMessages?: boolean;
};

type UnreadFilter = "all" | "unread";
type LockFilter = "all" | "locked" | "unlocked";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isYesterday(d: Date, now: Date) {
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return isSameDay(d, y);
}
function fmtStampNL(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();

  if (isSameDay(d, now)) {
    return new Intl.DateTimeFormat("nl-BE", { hour: "2-digit", minute: "2-digit" }).format(d);
  }
  if (isYesterday(d, now)) return "Gisteren";

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) {
    return new Intl.DateTimeFormat("nl-BE", { weekday: "short" }).format(d).replace(".", "");
  }

  return new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "short" }).format(d).replace(".", "");
}

function LockedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
function UnlockedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
function FunnelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 3H2l8 9v7l4 2v-9l8-9z" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls("transition", open ? "rotate-180" : "")}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function StatusPill({ t }: { t: Thread }) {
  const base = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold";
  if (t.isUnlocked) {
    return (
      <span className={cls(base, "border-emerald-400/30 bg-emerald-400/10 text-emerald-200")}>
        <UnlockedIcon />
        Unlocked
      </span>
    );
  }
  return (
    <span className={cls(base, "border-white/10 bg-white/5 text-white/70")}>
      <LockedIcon />
      Locked
    </span>
  );
}

function Avatar({ t }: { t: Thread }) {
  const [imgOk, setImgOk] = useState(true);
  const src = t.isUnlocked && t.otherFirstPhotoId ? `/api/photo/${t.otherFirstPhotoId}` : null;

  return (
    <div
      className={cls(
        "relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border",
        t.isUnlocked ? "border-emerald-400/35" : "border-white/10"
      )}
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      {src && imgOk ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setImgOk(false)} />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-emerald-200/90">
          <LockedIcon />
        </div>
      )}
      <div
        className={cls(
          "absolute -right-1 -top-1 h-4 w-4 rounded-full border",
          t.isUnlocked ? "border-emerald-300/50 bg-emerald-400" : "border-white/15 bg-white/10"
        )}
      />
    </div>
  );
}

function SegButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "rounded-xl border px-3 py-2 text-sm font-semibold transition",
        active ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-white/75 hover:bg-white/7"
      )}
    >
      {children}
    </button>
  );
}

const PROMPT_CHIPS = [
  "Wat maakt jouw weekend echt goed?",
  "Wat zoek je het meest in een relatie?",
  "Welke kleine dingen maken jou gelukkig?",
] as const;

function ThreadRow({
  t,
  onPrefill,
  archived,
}: {
  t: Thread;
  archived?: boolean;
  onPrefill: (matchId: string, msg: string) => void;
}) {
  const hasMsg = Boolean(t.lastMessageAt);
  const isNewMatch = !hasMsg;
  const time = fmtStampNL(t.lastMessageAt);
  const unread = t.unreadCount > 0;
  const unreadIncoming = unread && t.lastMessageFromOther;

  const preview = hasMsg ? (t.lastMessageText || "") : "Nieuwe match • Zeg hallo 👋";
  const who = hasMsg ? (t.lastMessageFromOther ? t.otherName : "Jij") : "";

  return (
    <Link
      href={`/chat/${t.matchId}`}
      className={cls(
        "group relative flex items-center gap-4 rounded-3xl border p-4 transition",
        archived
          ? "border-white/10 bg-white/[0.03] opacity-85 hover:opacity-100"
          : unread
            ? "border-emerald-400/55 bg-emerald-400/10 shadow-sm shadow-emerald-500/10"
            : isNewMatch
              ? "border-white/15 bg-white/7"
              : "border-white/10 bg-white/5",
        "hover:bg-white/7"
      )}
      aria-label={`Chat met ${t.otherName}${unread ? ` (${t.unreadCount} ongelezen)` : ""}`}
    >
      {unread && !archived ? <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-emerald-400/90" /> : null}

      <Avatar t={t} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={cls("truncate text-base font-semibold", unread && !archived ? "text-white" : "text-white/90")}>
                {t.otherName}
              </div>

              {unreadIncoming && !archived ? (
                <span className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2 py-0.5 text-[11px] font-extrabold text-emerald-100">
                  Nieuw
                </span>
              ) : null}

              {archived ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-bold text-white/60">
                  Gearchiveerd
                </span>
              ) : null}
            </div>

            <div className={cls("mt-1 truncate text-sm", unread && !archived ? "text-white/85" : "text-white/70")}>
              {hasMsg ? (
                <>
                  <span className="text-white/55">{who}: </span>
                  <span className={unread && !archived ? "text-white" : "text-white/80"}>{preview}</span>
                </>
              ) : (
                <span className="font-semibold text-emerald-200/90">{preview}</span>
              )}
            </div>

            {isNewMatch && !archived ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {PROMPT_CHIPS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPrefill(t.matchId, p);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/7"
                    title="Stuur als opener"
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="shrink-0 w-32 text-right">
            <div className="text-xs text-white/55">{time || ""}</div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <StatusPill t={t} />
              {unread && !archived ? (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-400 px-2 text-[12px] font-extrabold text-black" title="Ongelezen">
                  {t.unreadCount}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}

export default function ChatListClient() {
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [archivedThreads, setArchivedThreads] = useState<Thread[]>([]);
  const [archOpen, setArchOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [q, setQ] = useState("");
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>("all");
  const [lockFilter, setLockFilter] = useState<LockFilter>("all");

  const abortRef = useRef<AbortController | null>(null);

  const filtersActive = useMemo(() => {
    return q.trim() !== "" || unreadFilter !== "all" || lockFilter !== "all";
  }, [q, unreadFilter, lockFilter]);

  async function fetchThreadsWithRetry(mode: "initial" | "refresh") {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const doFetch = async () => {
      const res = await fetch("/api/chat/threads", { cache: "no-store", signal: ac.signal });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Kan gesprekken niet laden");
      const items: Thread[] = Array.isArray(data?.items) ? data.items : [];
      const arch: Thread[] = Array.isArray(data?.archivedItems) ? data.archivedItems : [];
      return { items, arch };
    };

    try {
      setError(null);
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);

      const { items, arch } = await doFetch();
      setThreads(items);
      setArchivedThreads(arch);
      return;
    } catch (e1: any) {
      try {
        await new Promise((r) => setTimeout(r, 350));
        const { items, arch } = await doFetch();
        setThreads(items);
        setArchivedThreads(arch);
        setError(null);
        return;
      } catch (e2: any) {
        if (e2?.name === "AbortError") return;
        setError(e2?.message || e1?.message || "Kan gesprekken niet laden");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchThreadsWithRetry("initial");

    const onThreadsChanged = () => void fetchThreadsWithRetry("refresh");
    window.addEventListener("depth:threads-changed", onThreadsChanged);

    const id = window.setInterval(() => void fetchThreadsWithRetry("refresh"), 8000);
    return () => {
      window.removeEventListener("depth:threads-changed", onThreadsChanged);
      window.clearInterval(id);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const xs = [...threads];
    xs.sort((a, b) => {
      const aNew = !a.lastMessageAt;
      const bNew = !b.lastMessageAt;
      if (aNew !== bNew) return aNew ? -1 : 1;

      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
    return xs;
  }, [threads]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return sorted.filter((t) => {
      if (query) {
        const hay = `${t.otherName} ${t.otherCity}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (unreadFilter === "unread" && !(t.unreadCount > 0)) return false;
      if (lockFilter === "locked" && t.isUnlocked) return false;
      if (lockFilter === "unlocked" && !t.isUnlocked) return false;
      return true;
    });
  }, [sorted, q, unreadFilter, lockFilter]);

  function prefillAndGo(matchId: string, msg: string) {
    try {
      sessionStorage.setItem(`depth:prefill:${matchId}`, msg);
    } catch {}
    router.push(`/chat/${matchId}`);
  }

  if (loading && threads.length === 0 && archivedThreads.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Laden…</div>
        <div className="mt-2 text-sm text-white/70">Even geduld.</div>
      </div>
    );
  }

  // ✅ Wanneer geen actieve threads, maar WEL archived threads => toon archived sectie ipv “geen matches”
  const hasAny = threads.length > 0 || archivedThreads.length > 0;

  if (!hasAny) {
    return (
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Nog geen matches</div>
        <div className="mt-2 text-sm text-white/70">
          Ga naar Discover om te swipen. Tip: na twee betekenisvolle antwoorden van jullie allebei worden foto’s ontgrendeld.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/discover" className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
            Naar Discover
          </Link>
          <Link href="/profile" className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/7">
            Profiel aanvullen
          </Link>
        </div>
      </div>
    );
  }

  const showingCount = filtered.length;
  const totalCount = sorted.length;

  return (
    <div className="mt-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-white/55">
            Foto’s ontgrendelen nadat jullie allebei twee keer betekenisvol hebben geantwoord.
            <span className="ml-2 text-white/35">•</span>
            <span className="ml-2">Trek op mobiel naar beneden om te vernieuwen.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchThreadsWithRetry("refresh")}
              className={cls("inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition", "border-white/10 bg-white/5 text-white/80 hover:bg-white/7")}
              title="Vernieuwen"
            >
              <span className={cls(refreshing ? "animate-spin" : "")}>
                <RefreshIcon />
              </span>
              <span className="hidden sm:inline">Vernieuwen</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className={cls(
                "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition",
                panelOpen ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/7"
              )}
              title="Zoeken & filters"
            >
              <FunnelIcon />
              <span className="hidden sm:inline">Zoeken</span>
              {filtersActive ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-2 text-[11px] font-extrabold text-black">
                  !
                </span>
              ) : null}
            </button>

            <div className="text-xs text-white/55 hidden md:block">
              {showingCount === totalCount ? `${totalCount} gesprekken` : `${showingCount} van ${totalCount}`}
              {refreshing ? <span className="ml-2 text-white/40">• bezig…</span> : null}
            </div>
          </div>
        </div>

        {panelOpen ? (
          <div className="mt-4 grid gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Zoek op naam of stad…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder:text-white/40 outline-none focus:border-emerald-400/35"
              />
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setUnreadFilter("all");
                  setLockFilter("all");
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/7"
              >
                Reset
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <SegButton active={unreadFilter === "all"} onClick={() => setUnreadFilter("all")}>
                  Alle
                </SegButton>
                <SegButton active={unreadFilter === "unread"} onClick={() => setUnreadFilter("unread")}>
                  Ongelezen
                </SegButton>
              </div>

              <div className="flex flex-wrap gap-2">
                <SegButton active={lockFilter === "all"} onClick={() => setLockFilter("all")}>
                  Alle status
                </SegButton>
                <SegButton active={lockFilter === "locked"} onClick={() => setLockFilter("locked")}>
                  Locked
                </SegButton>
                <SegButton active={lockFilter === "unlocked"} onClick={() => setLockFilter("unlocked")}>
                  Unlocked
                </SegButton>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            <div className="font-semibold">Kan gesprekken niet laden</div>
            <div className="mt-1 text-red-100/80">{error}</div>
          </div>
        ) : null}
      </div>

      {/* Active list */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {filtered.map((t) => (
            <ThreadRow key={t.matchId} t={t} onPrefill={prefillAndGo} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-base font-semibold">Geen resultaten</div>
          <div className="mt-2 text-sm text-white/70">Probeer een andere zoekterm of pas je filters aan.</div>
        </div>
      )}

      {/* Archived accordion */}
      {archivedThreads.length > 0 ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5">
          <button
            type="button"
            onClick={() => setArchOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4"
          >
            <div className="text-sm font-semibold text-white/85">
              Gearchiveerde chats <span className="ml-2 text-white/50">({archivedThreads.length})</span>
            </div>
            <div className="text-white/60">
              <ChevronIcon open={archOpen} />
            </div>
          </button>

          {archOpen ? (
            <div className="border-t border-white/10 px-5 py-5">
              <div className="grid gap-4">
                {archivedThreads.map((t) => (
                  <ThreadRow key={t.matchId} t={t} archived onPrefill={prefillAndGo} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
