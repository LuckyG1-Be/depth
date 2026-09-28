"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import SafetyMenu from "@/components/SafetyMenu";
import DateSafetyPlanner from "@/components/DateSafetyPlanner";

type Msg = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: string | Date;
  isRead?: boolean;
  readAt?: string | Date | null;
};

type QA = { q: string; a: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function fmtTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">{children}</span>;
}

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/**
 * Link safety (locked chats):
 * - keep as plain text, but also neutralize common URL patterns to reduce scam effectiveness
 * - does NOT add anchors; it only makes the text non-clickable / non-auto-linkable.
 */
function neutralizeIfLocked(text: string, locked: boolean) {
  if (!locked) return text;

  let t = text;

  // Remove zero-width chars (common to bypass filters / visual tricks)
  t = t.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, "");

  // Neutralize protocols
  t = t.replace(/\bhttps?:\/\//gi, (m) => (m.toLowerCase().startsWith("https") ? "hxxps://" : "hxxp://"));

  // Neutralize www.
  t = t.replace(/\bwww\./gi, "w\u200Bw.");

  // Neutralize dots in obvious domains (simple, readable)
  // e.g. example.com -> example[.]com
  t = t.replace(/\b([a-z0-9-]+)\.([a-z]{2,})(\b|\/)/gi, (_m, a, b, tail) => `${a}[.]${b}${tail}`);

  // Neutralize @handles (prevent “DM me @telegram” style)
  t = t.replace(/(^|\s)@([a-z0-9_]{2,32})\b/gi, (_m, pre, u) => `${pre}@\u200B${u}`);

  return t;
}

function Modal({ open, onClose, src }: { open: boolean; onClose: () => void; src: string }) {
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(true), [src]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6" onClick={onClose}>
      <div className="max-h-[85vh] max-w-[90vw] overflow-hidden rounded-3xl border border-white/10 bg-black/40">
        {ok ? (
          <img
            src={src}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={() => setOk(false)}
          />
        ) : (
          <div className="grid h-[60vh] w-[70vw] place-items-center p-6 text-sm text-white/70">Afbeelding kon niet geladen worden.</div>
        )}
      </div>
    </div>
  );
}

function UnlockCelebration({
  open,
  name,
  previewSrcs,
  onDone,
}: {
  open: boolean;
  name: string;
  previewSrcs: string[];
  onDone: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => onDone(), 2200);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-6">
      <div className="w-[min(720px,92vw)] rounded-3xl border border-white/10 bg-[#1e1b27] p-6 shadow-2xl">
        <div className="text-xl font-semibold">Foto’s ontgrendeld 🎉</div>
        <div className="mt-1 text-sm opacity-70">
          Je kan nu de foto’s van <b>{name}</b> zien.
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {previewSrcs.map((s, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <img src={s} alt="" className="h-32 w-full object-cover" />
            </div>
          ))}
        </div>

        <button
          onClick={onDone}
          className="mt-6 w-full rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20"
        >
          Oké
        </button>
      </div>
    </div>
  );
}

function sortByCreatedAsc(xs: Msg[]) {
  return [...xs].sort((a, b) => {
    const ta = new Date(a.createdAt as any).getTime();
    const tb = new Date(b.createdAt as any).getTime();
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });
}

function UnlockProgress({
  locked,
  remaining,
  total,
}: {
  locked: boolean;
  remaining: number;
  total: number;
}) {
  const done = Math.max(0, Math.min(total, total - (remaining || 0)));
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <div className="text-xs opacity-70">Unlock progress</div>
        <div className="text-xs opacity-70">{locked ? `${done}/${total}` : "Unlocked"}</div>
      </div>

      {/* segmented bar (premium-ish) */}
      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const on = !locked || i < done;
          return (
            <div
              key={i}
              className={cls("h-2 flex-1 rounded-full border", on ? "border-emerald-400/35" : "border-white/10")}
              style={{
                background: on ? "rgba(52, 211, 153, 0.22)" : "rgba(255,255,255,0.06)",
              }}
            />
          );
        })}
      </div>

      {/* subtle fill bar behind (extra smooth) */}
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-emerald-400/35 transition-[width] duration-300" style={{ width: `${locked ? pct : 100}%` }} />
      </div>

      <div className="mt-2 text-[11px] opacity-70">
        {locked ? (
          <>
            Nog <b>{remaining}</b> wissel{remaining === 1 ? "" : "s"} tot foto-unlock (jullie allebei twee betekenisvolle antwoorden).
          </>
        ) : (
          "Foto’s zijn zichtbaar. Links worden normaal weergegeven."
        )}
      </div>
    </div>
  );
}

export default function ChatView({
  match,
  meId,
  other,
  initial,
}: {
  match: { id: string; isUnlocked: boolean; isArchived: boolean; archivedAt: string | null };
  meId: string;
  other: {
    id: string;
    name: string;
    city: string;
    intent: string | null;
    religion: string | null;
    values: string[];
    passions: string[];
    qa: QA[];
    photoIds: string[];
    avatar: string;
  };
  initial: { messages: Msg[]; isUnlocked: boolean; remaining: number; unlockTotal?: number };
}) {
  const { toast } = useToast();
  const router = useRouter();

  const matchId = match.id;

  const [messages, setMessages] = useState<Msg[]>(initial.messages || []);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [modalSrc, setModalSrc] = useState<string | null>(null);

  const [celebrate, setCelebrate] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(Boolean(initial.isUnlocked));
  const [remaining, setRemaining] = useState<number>(initial.remaining ?? 0);

  const unlockTotal = initial.unlockTotal ?? 4;

  const [isArchived, setIsArchived] = useState(Boolean(match.isArchived));
  const [archivedAt, setArchivedAt] = useState<string | null>(match.archivedAt || null);

  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [avatarOk, setAvatarOk] = useState(true);

  const firstId = messages[0]?.id || null;
  const lastId = messages[messages.length - 1]?.id || null;

  async function markRead() {
    try {
      await fetch("/api/chat/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
    } catch {
      // silent
    }
  }

  // ✅ mark as read when page opens
  useEffect(() => {
    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Scroll to bottom on first mount
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function loadOlder() {
    if (!firstId || loadingOlder || !hasMoreOlder) return;

    setLoadingOlder(true);
    try {
      const res = await fetch(
        `/api/chat/poll?matchId=${encodeURIComponent(matchId)}&mode=older&cursor=${encodeURIComponent(firstId)}&limit=60`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "LOAD_OLDER_FAILED");

      const older = Array.isArray(data?.messages) ? (data.messages as Msg[]) : [];
      if (older.length === 0) {
        setHasMoreOlder(false);
        return;
      }

      setMessages((prev) => sortByCreatedAsc([...older, ...prev]));
      if (typeof data?.unlock?.remaining === "number") setRemaining(data.unlock.remaining);

      if (data?.unlock?.isUnlocked && !isUnlocked) {
        setIsUnlocked(true);
        setCelebrate(true);
        setTimeout(() => router.refresh(), 120);
      } else if (data?.unlock?.isUnlocked) {
        setIsUnlocked(true);
      }

      if (data?.isArchived) {
        setIsArchived(true);
        setArchivedAt(data?.archivedAt || null);
      }
    } catch (e: any) {
      toast({ kind: "error", title: "Chat", message: e?.message || "Oudere berichten laden mislukt" });
    } finally {
      setLoadingOlder(false);
    }
  }

  // Poll only new messages
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (!lastId) return;
      try {
        const res = await fetch(
          `/api/chat/poll?matchId=${encodeURIComponent(matchId)}&mode=newer&after=${encodeURIComponent(lastId)}&limit=60`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) return;
        if (cancelled) return;

        const newer = Array.isArray(data?.messages) ? (data.messages as Msg[]) : [];
        if (newer.length > 0) {
          setMessages((prev) => sortByCreatedAsc([...prev, ...newer]));
          markRead();
        }

        if (typeof data?.unlock?.remaining === "number") setRemaining(data.unlock.remaining);

        if (data?.unlock?.isUnlocked && !isUnlocked) {
          setIsUnlocked(true);
          setCelebrate(true);
          setTimeout(() => router.refresh(), 120);
        } else if (data?.unlock?.isUnlocked) {
          setIsUnlocked(true);
        }

        if (data?.isArchived) {
          setIsArchived(true);
          setArchivedAt(data?.archivedAt || null);
        }
      } catch {
        // silent
      }
    };

    const t = window.setInterval(tick, 3500);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [matchId, lastId, isUnlocked, router]);

  async function send() {
    const t = text.trim();
    if (!t || isArchived) return;

    setSending(true);
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
          setIsArchived(true);
          toast({ kind: "info", title: "Chat", message: "Deze match is gearchiveerd (15 dagen inactief) en is nu read-only." });
          return;
        }
        throw new Error(err);
      }

      setText("");

      if (data?.message?.id) {
        setMessages((prev) => sortByCreatedAsc([...prev, data.message as Msg]));
      }

      if (data?.unlock?.isUnlocked && !isUnlocked) {
        setIsUnlocked(true);
        setCelebrate(true);
      }
      if (typeof data?.unlock?.remaining === "number") setRemaining(data.unlock.remaining);

      setTimeout(() => router.refresh(), 120);
    } catch (e: any) {
      toast({ kind: "error", title: "Bericht", message: e?.message || "Bericht sturen mislukt" });
    } finally {
      setSending(false);
    }
  }

  const unlockedThumbs = other.photoIds.slice(0, 6).map((id) => `/api/photo/${id}`);
  const locked = !isUnlocked;
  const contactInfoWarning = locked && /(https?:\/\/|www\.|@\w+|telegram|whatsapp|instagram|\+?\d[\d\s().-]{7,})/i.test(text);

  const remainingLabel = useMemo(() => {
    if (isArchived) return "Gearchiveerd";
    if (!locked) return "Foto’s zichtbaar";
    if (remaining <= 0) return "Ontgrendelen…";
    return `Unlock na ${remaining} wissels`;
  }, [locked, remaining, isArchived]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:py-8">
      <Modal open={!!modalSrc} onClose={() => setModalSrc(null)} src={modalSrc || ""} />
      <UnlockCelebration open={celebrate} name={other.name} previewSrcs={unlockedThumbs.slice(0, 3)} onDone={() => setCelebrate(false)} />

      <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {avatarOk ? (
              <img
                src={other.avatar}
                alt=""
                className={other.avatar === "/logo.png" ? "h-full w-full object-contain p-2" : "h-full w-full object-cover"}
                onError={() => setAvatarOk(false)}
              />
            ) : (
              <img src="/logo.png" alt="Depth" className="h-full w-full object-contain p-2" />
            )}
          </div>

          <div>
            <div className="text-lg font-semibold sm:text-xl">{other.name}</div>
            <div className="text-sm opacity-70">{other.city}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {other.intent ? <Chip>{other.intent}</Chip> : null}
              {other.religion ? <Chip>{other.religion}</Chip> : null}
              <Chip>{remainingLabel}</Chip>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-emerald-100/80 sm:inline">Veiligheid</span>
          <SafetyMenu otherUserId={other.id} context="chat" />
        </div>
      </div>

      {isArchived ? (
        <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="font-semibold">Gearchiveerd gesprek</div>
          <div className="mt-1 opacity-80">
            Geen berichten gestuurd gedurende 15 dagen ⇒ match is gearchiveerd en read-only.
            {archivedAt ? ` (Gearchiveerd op ${new Date(archivedAt).toLocaleDateString("nl-BE")})` : ""}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Info */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold opacity-80">Jullie match</div>

            <UnlockProgress locked={locked} remaining={remaining} total={unlockTotal} />

            {other.values?.length ? (
              <div className="mt-5">
                <div className="text-xs opacity-70">Waarden</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {other.values.map((v) => (
                    <Chip key={v}>{v}</Chip>
                  ))}
                </div>
              </div>
            ) : null}

            {other.passions?.length ? (
              <div className="mt-5">
                <div className="text-xs opacity-70">Passies</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {other.passions.map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                </div>
              </div>
            ) : null}

            {other.qa?.length ? (
              <div className="mt-6">
                <div className="text-xs opacity-70">Depth vragen</div>
                <div className="mt-3 space-y-3">
                  {other.qa.map((x, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs font-semibold opacity-80">{x.q}</div>
                      <div className="mt-1 text-sm opacity-80">{x.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold opacity-80">Foto’s</div>
            {locked ? (
              <div className="mt-3 text-sm opacity-70">
                Foto’s worden zichtbaar na twee betekenisvolle antwoorden van jullie allebei.
                <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs opacity-80">
                  Tip: stel één vraag per bericht. Zo gaat de unlock sneller.
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {unlockedThumbs.map((src) => (
                  <button
                    key={src}
                    onClick={() => setModalSrc(src)}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                    title="Open"
                  >
                    <img src={src} alt="" className="h-28 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <DateSafetyPlanner otherName={other.name} />
        </div>

        {/* Right: Messages */}
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold opacity-80">Gesprek</div>

              <button
                onClick={loadOlder}
                disabled={loadingOlder || !hasMoreOlder || !firstId}
                className={cls(
                  "rounded-xl border px-3 py-2 text-xs font-semibold",
                  loadingOlder || !hasMoreOlder || !firstId
                    ? "border-white/10 bg-white/5 text-white/40"
                    : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30"
                )}
                title={hasMoreOlder ? "Oudere berichten laden" : "Geen oudere berichten"}
              >
                {loadingOlder ? "Laden…" : hasMoreOlder ? "Ouder" : "Geen ouder"}
              </button>
            </div>

            <div ref={scrollerRef} className="max-h-[55vh] overscroll-contain overflow-y-auto px-4 py-4 sm:max-h-[65vh] sm:px-5">
              <div className="space-y-3">
                {messages.map((m) => {
                  const mine = m.fromUserId === meId;
                  const d = new Date(m.createdAt as any);
                  return (
                    <div key={m.id} className={cls("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cls(
                          "max-w-[82%] rounded-2xl border px-3.5 py-2.5",
                          mine ? "border-emerald-400/25 bg-emerald-400/10" : "border-white/10 bg-black/20"
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words text-sm">
                          {neutralizeIfLocked(String(m.text || ""), locked)}
                        </div>
                        <div className="mt-1.5 text-right text-[11px] opacity-60">{fmtTime(d)}</div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 ? <div className="py-10 text-center text-sm opacity-60">Nog geen berichten.</div> : null}
              </div>
            </div>

            <div className="border-t border-white/10 px-4 py-4 sm:px-5">
              {contactInfoWarning ? <div className="mb-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">Voor je veiligheid raden we aan om contactgegevens pas buiten de app te delen wanneer je iemand voldoende vertrouwt.</div> : null}
              <div className="flex items-end gap-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={sending || isArchived}
                  placeholder={isArchived ? "Gearchiveerd gesprek (read-only)" : "Typ je bericht…"}
                  className={cls(
                    "min-h-[44px] w-full resize-none rounded-2xl border bg-black/20 px-4 py-3 text-sm outline-none",
                    "border-white/10 focus:border-emerald-400/25",
                    sending || isArchived ? "opacity-60" : ""
                  )}
                />

                <button
                  onClick={send}
                  disabled={sending || !text.trim() || isArchived}
                  className={cls(
                    "shrink-0 rounded-2xl border px-4 py-3 text-sm font-semibold",
                    sending || !text.trim() || isArchived
                      ? "border-white/10 bg-white/5 text-white/40"
                      : "border-emerald-400/30 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/20"
                  )}
                >
                  {sending ? "…" : "Stuur"}
                </button>
              </div>

              {locked ? (
                <div className="mt-3 text-xs opacity-65">
                  Links zijn <b>niet klikbaar</b> tot jullie foto’s ontgrendeld zijn.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
