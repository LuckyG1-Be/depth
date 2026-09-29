"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import type { ToolSession } from "@/components/premium/DepthToolRunnerModal";
import { ENABLE_TYPING } from "@/components/chat/constants";
import type { ChatViewLayoutProps } from "@/components/chat/ChatViewLayout";
import { useIsCoarsePointer, useNow } from "@/components/chat/hooks";
import { useChatConversationCoach } from "@/components/chat/useConversationCoach";
import type { ChatViewProps, Msg, PollResp } from "@/components/chat/types";
import { isSameDayBrussels, labelIntent, labelReligion, mergeById, presenceLabel, vib } from "@/components/chat/utils";

export function useChatViewController({ match, meId, other, initial }: ChatViewProps): ChatViewLayoutProps {
  const { toast } = useToast();
  const router = useRouter();

  const matchId = match.id;

  const draftKey = `depth:draft:${matchId}`;

  const [messages, setMessages] = useState<Msg[]>(initial.messages || []);
  const [text, setText] = useState(() => {
    try {
      const v = localStorage.getItem(draftKey);
      return v || "";
    } catch {
      return "";
    }
  });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [modalSrc, setModalSrc] = useState<string | null>(null);

  const [celebrate, setCelebrate] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(Boolean(initial.isUnlocked));
  const [remaining, setRemaining] = useState<number>(initial.remaining ?? 0);

  const unlockTotal = initial.unlockTotal ?? 5;

  const [isArchived, setIsArchived] = useState(Boolean(match.isArchived));
  const [archivedAt, setArchivedAt] = useState<string | null>(match.archivedAt || null);

  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [avatarOk, setAvatarOk] = useState(true);

  const [otherTyping, setOtherTyping] = useState(false);

  const [newSinceBottom, setNewSinceBottom] = useState(0);
  const atBottomRef = useRef(true);

  const coarse = useIsCoarsePointer();
  const [forceTimeIds, setForceTimeIds] = useState<Set<string>>(() => new Set());
  const pressTimerRef = useRef<number | null>(null);

  const [infoOpen, setInfoOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ C) Dedicated Depth tools modal (chat context)
  const [toolsOpen, setToolsOpen] = useState(false);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [toolSession, setToolSession] = useState<ToolSession | null>(null);

  // ✅ hydration-safe time source
  const now = useNow();

  const [prefSound, setPrefSound] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("depth:pref:unlockSound");
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });
  const [prefHaptics, setPrefHaptics] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("depth:pref:unlockHaptics");
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("depth:pref:unlockSound", prefSound ? "1" : "0");
    } catch {}
  }, [prefSound]);
  useEffect(() => {
    try {
      localStorage.setItem("depth:pref:unlockHaptics", prefHaptics ? "1" : "0");
    } catch {}
  }, [prefHaptics]);

  const unlockShownKey = `depth:unlockShown:${matchId}`;
  const [showCinematic, setShowCinematic] = useState(false);
  const [cinematicConfetti, setCinematicConfetti] = useState(false);

  const firstId = messages[0]?.id || null;
  const lastId = messages[messages.length - 1]?.id || null;

  // ✅ hydration-safe presence (no "now" during SSR / first client render)
  const presence = useMemo(() => presenceLabel(other.lastSeenAt, now), [other.lastSeenAt, now]);
  const streakDays = initial.streakDays ?? 0;

  const lastMsgAt = useMemo(() => {
    const raw = initial.lastMsgAt || (messages.length ? String(messages[messages.length - 1].createdAt) : null);
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }, [initial.lastMsgAt, messages]);

  // ✅ avoid new Date() mismatch during hydration by using "now" (0 => false)
  const momentum = useMemo(() => {
    if (!lastMsgAt) return false;
    if (!now) return false;
    return isSameDayBrussels(lastMsgAt, new Date(now));
  }, [lastMsgAt, now]);

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, text);
    } catch {}
  }, [draftKey, text]);

  useEffect(() => {
    try {
      const key = `depth:prefill:${matchId}`;
      const v = sessionStorage.getItem(key);
      if (v && v.trim()) {
        sessionStorage.removeItem(key);
        setText(v);
        requestAnimationFrame(() => {
          const el = textareaRef.current;
          if (!el) return;
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        });
      }
    } catch {}
  }, [matchId]);

  async function markRead() {
    try {
      await fetch("/api/chat/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      try {
        window.dispatchEvent(new Event("depth:threads-changed"));
      } catch {}
    } catch {}
  }

  useEffect(() => {
    void markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    requestAnimationFrame(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight }));
  }, []);

  function isNearBottom() {
    const sc = scrollerRef.current;
    if (!sc) return true;
    const dist = sc.scrollHeight - (sc.scrollTop + sc.clientHeight);
    return dist < 220;
  }

  function scrollToBottom(smooth = true) {
    const sc = scrollerRef.current;
    if (!sc) return;
    sc.scrollTo({ top: sc.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setNewSinceBottom(0);
  }

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const onScroll = () => {
      const near = isNearBottom();
      atBottomRef.current = near;
      if (near) setNewSinceBottom(0);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => sc.removeEventListener("scroll", onScroll);
  }, []);

  async function fetchPoll(url: string): Promise<PollResp | null> {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as PollResp | null;
      if (!res.ok || data?.ok === false) return null;
      return data;
    } catch {
      return null;
    }
  }

  const pollTimerRef = useRef<number | null>(null);
  const pollSeqRef = useRef(0);
  const noChangeCountRef = useRef(0);

  const lastIdRef = useRef<string | null>(lastId);
  const matchIdRef = useRef(matchId);

  useEffect(() => {
    lastIdRef.current = lastId;
  }, [lastId]);

  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

  function clearPollTimer() {
    if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
  }

  function tryShowUnlockCinematic() {
    try {
      const shown = localStorage.getItem(unlockShownKey) === "1";
      if (shown) return false;
      localStorage.setItem(unlockShownKey, "1");
      setCinematicConfetti(true);
      setShowCinematic(true);
      return true;
    } catch {
      setCinematicConfetti(true);
      setShowCinematic(true);
      return true;
    }
  }

  function applyServerState(data: PollResp | null) {
    if (!data) return;

    if (typeof data?.unlock?.remaining === "number") setRemaining(data.unlock.remaining);

    if (data?.unlock?.isUnlocked && !isUnlocked) {
      setIsUnlocked(true);
      const didCinematic = tryShowUnlockCinematic();
      if (!didCinematic) setCelebrate(true);
      // Geen route-refresh na unlock: lokale state + polling houden de chat stabiel op mobiel.
    } else if (data?.unlock?.isUnlocked) {
      setIsUnlocked(true);
    }

    if (data?.isArchived) {
      setIsArchived(true);
      setArchivedAt(data?.archivedAt || null);
      clearPollTimer();
      try {
        window.dispatchEvent(new Event("depth:threads-changed"));
      } catch {}
    }

    if (!ENABLE_TYPING) setOtherTyping(false);
  }

  async function loadOlder() {
    if (!firstId || loadingOlder || !hasMoreOlder) return;

    const scroller = scrollerRef.current;
    const prevHeight = scroller?.scrollHeight ?? 0;
    const prevTop = scroller?.scrollTop ?? 0;

    setLoadingOlder(true);
    try {
      const url = `/api/chat/poll?matchId=${encodeURIComponent(matchId)}&mode=older&cursor=${encodeURIComponent(firstId)}&limit=60`;
      const data = await fetchPoll(url);
      if (!data) throw new Error("Oudere berichten laden mislukt");

      const older = Array.isArray(data?.messages) ? (data.messages as Msg[]) : [];
      if (older.length === 0) {
        setHasMoreOlder(false);
        applyServerState(data);
        return;
      }

      setMessages((prev) => mergeById(prev, older));
      applyServerState(data);

      requestAnimationFrame(() => {
        const sc = scrollerRef.current;
        if (!sc) return;
        const newHeight = sc.scrollHeight;
        const delta = newHeight - prevHeight;
        sc.scrollTo({ top: prevTop + delta });
      });
    } catch (e: any) {
      toast({ kind: "error", title: "Chat", message: e?.message || "Oudere berichten laden mislukt" });
    } finally {
      setLoadingOlder(false);
    }
  }

  async function pollOnce() {
    if (isArchived) return;

    const seq = ++pollSeqRef.current;

    const currentMatchId = matchIdRef.current;
    const currentLastId = lastIdRef.current;

    const url = currentLastId
      ? `/api/chat/poll?matchId=${encodeURIComponent(currentMatchId)}&mode=newer&after=${encodeURIComponent(currentLastId)}&limit=60`
      : `/api/chat/poll?matchId=${encodeURIComponent(currentMatchId)}&mode=latest&limit=60`;

    const data = await fetchPoll(url);

    if (seq !== pollSeqRef.current) return;
    if (!data) return;

    const incoming = Array.isArray(data?.messages) ? (data.messages as Msg[]) : [];

    if (incoming.length > 0) {
      noChangeCountRef.current = 0;
      const wasAtBottom = atBottomRef.current;

      setMessages((prev) => mergeById(prev, incoming));
      void markRead();
      try {
        window.dispatchEvent(new Event("depth:threads-changed"));
      } catch {}

      requestAnimationFrame(() => {
        if (wasAtBottom) {
          scrollToBottom(true);
        } else {
          setNewSinceBottom((n) => Math.min(99, n + incoming.length));
        }
      });
    } else {
      noChangeCountRef.current = Math.min(20, noChangeCountRef.current + 1);
    }

    applyServerState(data);
  }

  function scheduleNextPoll() {
    if (isArchived) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    const noChange = noChangeCountRef.current;
    const typingBoost = text.trim().length > 0 ? 1 : 0;
    const awayFromBottomPenalty = atBottomRef.current ? 0 : 1800;
    const ms = Math.max(2600, Math.min(18000, 3200 + awayFromBottomPenalty + noChange * 900 - typingBoost * 700));

    clearPollTimer();
    pollTimerRef.current = window.setTimeout(() => {
      void pollOnce().finally(() => {
        scheduleNextPoll();
      });
    }, ms);
  }

  useEffect(() => {
    clearPollTimer();
    noChangeCountRef.current = 0;

    if (!isArchived) {
      void pollOnce().finally(() => scheduleNextPoll());
    }

    const onVis = () => {
      clearPollTimer();
      if (!document.hidden && !isArchived) {
        noChangeCountRef.current = 0;
        void pollOnce().finally(() => scheduleNextPoll());
      }
    };

    const onOnline = () => {
      clearPollTimer();
      if (!document.hidden && !isArchived) {
        noChangeCountRef.current = 0;
        void pollOnce().finally(() => scheduleNextPoll());
      }
    };

    const onOffline = () => {
      clearPollTimer();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearPollTimer();
      pollSeqRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, isArchived]);

  async function send() {
    const t = text.trim();
    if (!t || sending || isArchived) return;
    setSendError(null);
    await doSend(t);
  }

  async function doSend(tRaw: string) {
    const t = String(tRaw || "").trim();
    if (!t || isArchived || sending) return;

    const optimisticId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimisticAt = new Date().toISOString();
    const optimisticMessage: Msg = {
      id: optimisticId,
      fromUserId: meId,
      toUserId: other.id,
      text: t,
      createdAt: optimisticAt,
      isRead: true,
      readAt: optimisticAt,
    };

    setSendError(null);
    setSending(true);
    setText("");
    setMessages((prev) => mergeById(prev, [optimisticMessage]));
    try {
      localStorage.removeItem(draftKey);
      sessionStorage.setItem("depth:threads-refresh-needed", "1");
    } catch {}
    requestAnimationFrame(() => scrollToBottom(false));

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, text: t }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        const err = String(data?.error || "SEND_FAILED");
        if (err === "ARCHIVED") {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          setIsArchived(true);
          toast({ kind: "info", title: "Chat", message: "Deze match is gearchiveerd en is nu read-only." });
          clearPollTimer();
          pollSeqRef.current++;
          return;
        }
        throw new Error(err);
      }

      const newId = String(data?.message?.id || data?.id || "");
      const createdAt = String(data?.message?.createdAt || data?.createdAt || optimisticAt);

      const mine: Msg = {
        id: newId || optimisticId,
        fromUserId: meId,
        toUserId: other.id,
        text: t,
        createdAt,
        isRead: true,
        readAt: createdAt,
      };

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        return mergeById(withoutOptimistic, [mine]);
      });
      setSendError(null);

      if (typeof data?.unlock?.remaining === "number") setRemaining(data.unlock.remaining);
      if (data?.unlock?.isUnlocked && !isUnlocked) {
        setIsUnlocked(true);
        const didCinematic = tryShowUnlockCinematic();
        if (!didCinematic) setCelebrate(true);
      } else if (data?.unlock?.isUnlocked) {
        setIsUnlocked(true);
      }

      try {
        sessionStorage.setItem("depth:threads-refresh-needed", "1");
        window.dispatchEvent(new Event("depth:threads-changed"));
      } catch {}

      // Geen route-refresh na unlock: lokale state + polling houden de chat stabiel op mobiel.
      requestAnimationFrame(() => scrollToBottom(true));

      noChangeCountRef.current = 0;
      pollSeqRef.current++;
      scheduleNextPoll();
    } catch (e: any) {
      const err = String(e?.message || "Bericht sturen mislukt");
      const msg =
        err === "QUEUED"
          ? "Deze match staat nog klaar, maar is pas beschikbaar zodra er een match-slot vrij is."
          : err === "REPEATED"
            ? "Je stuurde net hetzelfde bericht. Probeer iets anders."
            : err === "CHAT_BANNED"
              ? "Je kan tijdelijk geen berichten sturen."
              : err === "MESSAGE_BLOCKED"
                ? "Dit bericht kan nog niet worden verstuurd. Hou het veilig en zonder contactgegevens vóór unlock."
                : err === "ACCOUNT_FROZEN"
                  ? "Je account is tijdelijk gepauzeerd voor veiligheidsreview."
                  : err;
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setText((current) => current.trim().length > 0 ? current : t);
      setSendError(msg);
      toast({ kind: "error", title: "Bericht", message: msg });
    } finally {
      setSending(false);
    }
  }

  async function archiveChat() {
    if (isArchived) return;

    try {
      const res = await fetch("/api/chat/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(String(data?.error || "ARCHIVE_FAILED"));

      setIsArchived(true);
      setArchivedAt(String(data?.archivedAt || new Date().toISOString()));
      clearPollTimer();
      pollSeqRef.current++;
      try {
        window.dispatchEvent(new Event("depth:threads-changed"));
      } catch {}
      toast({ kind: "success", title: "Chat", message: "Chat is gearchiveerd." });
      router.refresh();
    } catch (e: any) {
      toast({ kind: "error", title: "Chat", message: e?.message || "Archiveren mislukt" });
    }
  }

  async function unmatchNow() {
    const ok = window.confirm("Ontmatchen? Dit verwijdert de chat meteen en kan niet ongedaan gemaakt worden.");
    if (!ok) return;

    try {
      const res = await fetch("/api/chat/unmatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(String(data?.error || "UNMATCH_FAILED"));

      try {
        window.dispatchEvent(new Event("depth:threads-changed"));
      } catch {}
      toast({ kind: "success", title: "Match", message: "Ontmatcht. Chat verwijderd." });
      router.push("/chat");
      router.refresh();
    } catch (e: any) {
      toast({ kind: "error", title: "Match", message: e?.message || "Ontmatchen mislukt" });
    }
  }

  async function startDepthTool(toolKey: string) {
    try {
      const idemKey = matchId + ":" + toolKey + ":" + Date.now();
      const res = await fetch("/api/depth/tools/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, toolKey, idemKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        const err = String(data?.error || "FAILED");
        if (err === "INSUFFICIENT_TOKENS") {
          toast({ kind: "error", title: "Onvoldoende tokens", message: "Open je Wallet om extra tokens te kopen of kies een goedkoper Depth-moment." });
          return;
        }
        throw new Error(err);
      }

      setToolsOpen(false);
      setToolSession(data.session as ToolSession);
      setRunnerOpen(true);
      toast({ kind: "success", title: "Depth-tool", message: "Gestart. Het resultaat kan straks als chatbericht geplaatst worden." });

      try {
        window.dispatchEvent(new Event("depth:wallet-changed"));
        window.dispatchEvent(new Event("depth:threads-changed"));
      } catch {}
      // Geen route-refresh na Depth-tool start; wallet/thread events en lokale state volstaan.
    } catch (e: any) {
      toast({ kind: "error", title: "Depth-tool", message: e?.message || "Starten mislukt" });
    }
  }


  const unlockedThumbs = (other.photoIds || []).slice(0, 6).map((id) => `/api/photo/${id}`);
  const locked = !isUnlocked;

  const lockedPhotoId = other.allPhotoIds?.[0] || null;
  const lockedAvatarSrc = lockedPhotoId ? `/api/photo/preview/${lockedPhotoId}?w=220&blur=18` : other.avatar;

  useEffect(() => {
    setAvatarOk(true);
  }, [lockedAvatarSrc, other.avatar, isUnlocked]);

  const remainingLabel = useMemo(() => {
    if (isArchived) return "Gearchiveerd";
    if (!locked) return "Foto’s zichtbaar";
    if (remaining <= 0) return "Ontgrendelen…";
    if (remaining === 1) return "Nog 1 reactie";
    return `Nog ${remaining} reacties`;
  }, [locked, remaining, isArchived]);

  const lastMsgTime = useMemo(() => {
    const m = messages[messages.length - 1];
    if (!m) return null;
    const d = new Date(m.createdAt);
    return isNaN(d.getTime()) ? null : d;
  }, [messages]);

  const { quickReplies, conversationCoach } = useChatConversationCoach({
    messages,
    meId,
    other,
    text,
    isArchived,
    locked,
    remaining,
    isUnlocked,
    now,
    lastMsgTime,
  });

  function insertQuickReply(q: string) {
    setText(q);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const el = textareaRef.current;
      if (!el) return;
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
    if (prefHaptics) vib(10);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const on = (e: MouseEvent) => {
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (!t) return setMenuOpen(false);
      if (t.closest?.("[data-chat-menu]")) return;
      setMenuOpen(false);
    };
    window.addEventListener("click", on);
    return () => window.removeEventListener("click", on);
  }, [menuOpen]);

  function onBubblePressStart(id: string) {
    if (!coarse) return;
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = window.setTimeout(() => {
      setForceTimeIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      if (prefHaptics) vib(8);
    }, 420);
  }
  function onBubblePressEnd() {
    if (!coarse) return;
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  }

  const headerGlow = momentum && !isArchived ? "shadow-[0_0_0_1px_rgba(110,231,183,0.22),0_0_60px_rgba(110,231,183,0.10)]" : "";

  const canSend = !sending && !isArchived && text.trim().length > 0;

  const intentLabel = labelIntent(other.intent);
  const religionLabel = labelReligion(other.religion);


  return {
    modalSrc,
    setModalSrc,
    infoOpen,
    setInfoOpen,
    toolsOpen,
    setToolsOpen,
    runnerOpen,
    setRunnerOpen,
    toolSession,
    setToolSession,
    startDepthTool,
    sendDepthToolResult: doSend,
    showCinematic,
    setShowCinematic,
    cinematicConfetti,
    setCinematicConfetti,
    prefHaptics,
    setPrefHaptics,
    prefSound,
    setPrefSound,
    other,
    matchId,
    locked,
    lockedAvatarSrc,
    avatarOk,
    setAvatarOk,
    streakDays,
    presence,
    intentLabel,
    religionLabel,
    unlockTotal,
    remaining,
    remainingLabel,
    isArchived,
    isUnlocked,
    otherTyping,
    archivedAt,
    headerGlow,
    menuOpen,
    setMenuOpen,
    archiveChat,
    unmatchNow,
    unlockedThumbs,
    scrollerRef,
    textareaRef,
    messages,
    meId,
    loadingOlder,
    hasMoreOlder,
    firstId,
    newSinceBottom,
    forceTimeIds,
    coarse,
    text,
    sending,
    sendError,
    canSend,
    quickReplies,
    conversationCoach,
    setText,
    scrollToBottom,
    loadOlder,
    send,
    insertQuickReply,
    onBubblePressStart,
    onBubblePressEnd,
  };
}
