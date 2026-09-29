"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatListControls } from "@/components/chat/ChatListControls";
import { ChatListSlotsPanel } from "@/components/chat/ChatListSlots";
import { ArchivedThreadRow, ThreadRow } from "@/components/chat/ChatThreadRow";
import type { LockFilter, SlotMeta, Thread, UnreadFilter } from "@/components/chat/ChatListTypes";
import { buildSlotsUi, filterAndSortThreads } from "@/components/chat/ChatListUtils";

export default function ChatListClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [meta, setMeta] = useState<SlotMeta | null>(null);

  const [q, setQ] = useState("");
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>("all");
  const [lockFilter, setLockFilter] = useState<LockFilter>("all");

  const abortRef = useRef<AbortController | null>(null);

  async function fetchThreads() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/chat/threads", { cache: "no-store", signal: ac.signal });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "FAILED");

      setThreads(Array.isArray(json.threads) ? json.threads : []);
      setMeta(json.meta || null);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Kon chats niet laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchThreads();

    const onChanged = () => {
      fetchThreads();
    };
    window.addEventListener("depth:threads-changed", onChanged);
    return () => window.removeEventListener("depth:threads-changed", onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derived = useMemo(
    () => filterAndSortThreads({ threads, q, unreadFilter, lockFilter }),
    [threads, q, unreadFilter, lockFilter]
  );

  const slotsUi = useMemo(() => buildSlotsUi(meta, derived.activeCount), [meta, derived.activeCount]);
  const headerCount = derived.active.length;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-3xl font-semibold text-white">Chat</h1>
        <div className="mt-1 text-sm text-white/60">Je matches en gesprekken.</div>
      </div>

      <div className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <ChatListSlotsPanel slotsUi={slotsUi} />
        <ChatListControls
          q={q}
          unreadFilter={unreadFilter}
          lockFilter={lockFilter}
          headerCount={headerCount}
          onQueryChange={setQ}
          onUnreadFilterChange={setUnreadFilter}
          onLockFilterChange={setLockFilter}
          onRefresh={fetchThreads}
        />
      </div>

      {err ? <ChatListError error={err} onRetry={fetchThreads} /> : null}
      {loading ? <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white/70">Laden…</div> : null}

      {!loading && !err ? (
        <>
          <div className="space-y-3">
            {derived.active.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white/70">Nog geen gesprekken.</div>
            ) : (
              derived.active.map((t) => <ThreadRow key={t.matchId} t={t} now={derived.now} />)
            )}
          </div>

          <ArchivedChats threads={derived.archived} />

          <div className="mt-6 flex items-center justify-between">
            <Link
              href="/discover"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Naar Discover
            </Link>

            <button
              type="button"
              onClick={() => {
                setQ("");
                setUnreadFilter("all");
                setLockFilter("all");
                router.refresh();
              }}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/70 hover:bg-black/30"
            >
              Reset filters
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

function ChatListError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-5 text-rose-50">
      <div className="font-semibold">Kon chats niet laden</div>
      <div className="mt-1 text-sm opacity-80">{error}</div>
      <button onClick={onRetry} className="mt-4 rounded-2xl bg-rose-400 px-4 py-2 text-sm font-semibold text-black hover:bg-rose-300">
        Opnieuw proberen
      </button>
    </div>
  );
}

function ArchivedChats({ threads }: { threads: Thread[] }) {
  return (
    <details className="mt-6 rounded-3xl border border-white/10 bg-white/5">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-white/80">
        <span className="font-semibold">Gearchiveerde chats</span>
        <span className="text-white/60">({threads.length})</span>
      </summary>

      <div className="px-5 pb-5 pt-1">
        <div className="space-y-3">
          {threads.length === 0 ? (
            <div className="text-sm text-white/60">Geen gearchiveerde chats.</div>
          ) : (
            threads.map((t) => <ArchivedThreadRow key={t.matchId} t={t} />)
          )}
        </div>
      </div>
    </details>
  );
}
