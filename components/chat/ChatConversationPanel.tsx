import type { RefObject } from "react";
import MessageSkeleton from "./MessageSkeleton";
import type { Msg } from "./types";
import { cls, fmtTime, neutralizeIfLocked } from "./utils";

type ConversationCoach = {
  tone: "archived" | "unlocked" | "start" | "wait" | "turn";
  title: string;
  body: string;
};

type Props = {
  scrollerRef: RefObject<HTMLDivElement>;
  textareaRef: RefObject<HTMLTextAreaElement>;
  messages: Msg[];
  meId: string;
  loadingOlder: boolean;
  hasMoreOlder: boolean;
  firstId: string | null;
  newSinceBottom: number;
  forceTimeIds: Set<string>;
  coarse: boolean;
  isUnlocked: boolean;
  text: string;
  sending: boolean;
  isArchived: boolean;
  sendError: string | null;
  canSend: boolean;
  quickReplies: string[];
  conversationCoach: ConversationCoach;
  otherName: string;
  locked: boolean;
  remaining: number;
  unlockTotal: number;
  setText: (value: string) => void;
  scrollToBottom: (smooth?: boolean) => void;
  loadOlder: () => void;
  send: () => void;
  onQuickReply: (value: string) => void;
  onOpenTools: () => void;
  onBubblePressStart: (id: string) => void;
  onBubblePressEnd: () => void;
};

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l1.7 5.2L19 9l-5.3 1.8L12 16l-1.7-5.2L5 9l5.3-1.8L12 2Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  );
}

function coachToneClass(tone: ConversationCoach["tone"]) {
  if (tone === "unlocked") return "border-emerald-300/22 bg-emerald-400/10 text-emerald-50";
  if (tone === "wait") return "border-amber-300/20 bg-amber-400/10 text-amber-50";
  if (tone === "turn") return "border-sky-300/20 bg-sky-400/10 text-sky-50";
  if (tone === "archived") return "border-white/10 bg-white/5 text-white/58";
  return "border-white/10 bg-white/[0.055] text-white/72";
}

export default function ChatConversationPanel({
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
  isUnlocked,
  text,
  sending,
  isArchived,
  sendError,
  canSend,
  quickReplies,
  conversationCoach,
  otherName,
  locked,
  remaining,
  unlockTotal,
  setText,
  scrollToBottom,
  loadOlder,
  send,
  onQuickReply,
  onOpenTools,
  onBubblePressStart,
  onBubblePressEnd,
}: Props) {
  const textLength = text.trim().length;
  const disabledReason = isArchived ? "Gearchiveerd" : sending ? "Versturen…" : null;
  const done = Math.max(0, unlockTotal - remaining);

  return (
    <section className="mx-auto flex h-[calc(100dvh_-_96px_-_env(safe-area-inset-top))] max-w-3xl flex-col bg-[#1e1b27] text-white">
      <div ref={scrollerRef} className="relative flex-1 overflow-y-auto px-3 py-3">
        <div className="mx-auto max-w-2xl space-y-3 pb-4">
          {loadingOlder ? <MessageSkeleton /> : null}

          {hasMoreOlder && firstId ? (
            <div className="flex justify-center">
              <button
                onClick={loadOlder}
                disabled={loadingOlder}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/66 shadow-sm disabled:opacity-50"
                type="button"
              >
                {loadingOlder ? "Laden…" : "Oudere berichten"}
              </button>
            </div>
          ) : null}

          {messages.length === 0 ? (
            <div className="mx-auto mt-6 max-w-sm rounded-[24px] border border-white/10 bg-white/[0.055] px-5 py-5 text-center shadow-[0_18px_46px_rgba(0,0,0,0.20)]">
              <div className="text-base font-semibold text-white">Zeg hallo tegen {otherName || "je match"}</div>
              <p className="mt-2 text-sm leading-6 text-white/58">Eén persoonlijke vraag is genoeg om het gesprek te starten.</p>
            </div>
          ) : null}

          {messages.map((m) => {
            const mine = m.fromUserId === meId;
            const d = new Date(m.createdAt);
            const ok = !isNaN(d.getTime());
            const showTime = forceTimeIds.has(m.id);
            const showReadDot = mine && Boolean(m.readAt);

            return (
              <div key={m.id} className={cls("depth-message-in flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cls(
                    "group max-w-[82%] rounded-[22px] px-4 py-2.5 text-[15px] leading-6 shadow-sm transition-all",
                    mine
                      ? "rounded-br-md bg-emerald-300 text-[#102016] shadow-[0_10px_24px_rgba(102,185,108,0.16)]"
                      : "rounded-bl-md border border-white/10 bg-white/[0.07] text-white"
                  )}
                  onTouchStart={() => onBubblePressStart(m.id)}
                  onTouchEnd={onBubblePressEnd}
                  onTouchCancel={onBubblePressEnd}
                  onMouseDown={() => {
                    if (!coarse) return;
                    onBubblePressStart(m.id);
                  }}
                  onMouseUp={onBubblePressEnd}
                >
                  <div className="whitespace-pre-wrap break-words">{neutralizeIfLocked(String(m.text || ""), !isUnlocked)}</div>
                  <div
                    className={cls(
                      "flex items-center justify-end gap-2 overflow-hidden text-[11px] transition-all",
                      mine ? "text-[#102016]/55" : "text-white/42",
                      coarse ? "mt-1 max-h-6 opacity-100" : "mt-0 max-h-0 opacity-0 group-hover:mt-1 group-hover:max-h-6 group-hover:opacity-100",
                      showTime ? "mt-1 max-h-6 opacity-100" : ""
                    )}
                  >
                    {showReadDot ? <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#102016]/45" title="Gelezen" /> : null}
                    <span>{ok ? fmtTime(d) : ""}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {newSinceBottom > 0 ? (
          <button
            onClick={() => scrollToBottom(true)}
            className="sticky bottom-3 left-1/2 z-10 mx-auto w-fit -translate-x-1/2 rounded-full bg-emerald-300 px-4 py-2 text-xs font-semibold text-[#102016] shadow-lg"
            title="Naar nieuwste berichten"
            type="button"
          >
            {newSinceBottom} nieuw bericht{newSinceBottom === 1 ? "" : "en"}
          </button>
        ) : null}
      </div>

      <div className="border-t border-white/10 bg-[#181521]/96 px-3 py-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] shadow-[0_-18px_48px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          {sendError ? <div className="mb-2 rounded-2xl border border-rose-300/18 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">{sendError}</div> : null}

          <div className={cls("mb-2 rounded-2xl border px-3 py-2 text-xs leading-5", coachToneClass(conversationCoach.tone))}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{conversationCoach.title}</span>
              {locked ? <span className="shrink-0 rounded-full bg-black/18 px-2 py-0.5 text-[11px]">{done}/{unlockTotal} berichten</span> : null}
            </div>
            <div className="mt-0.5 line-clamp-2 opacity-80">{conversationCoach.body}</div>
          </div>

          {quickReplies.length > 0 ? (
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {quickReplies.map((q) => (
                <button key={q} type="button" onClick={() => onQuickReply(q)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-left text-xs font-semibold text-white/68 shadow-sm active:scale-95">
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-end gap-2">
            <button type="button" onClick={onOpenTools} disabled={isArchived} className="mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/76 disabled:opacity-35" aria-label="Gesprekshulp">
              <SparkIcon />
            </button>

            <div className="min-w-0 flex-1 rounded-full border border-white/12 bg-black/20 px-4 py-1.5 shadow-sm focus-within:border-emerald-300/35 focus-within:shadow-[0_0_0_3px_rgba(102,185,108,0.10)]">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={sending || isArchived}
                placeholder={isArchived ? "Gearchiveerd" : "Aa"}
                rows={1}
                className="max-h-28 min-h-[30px] w-full resize-none bg-transparent py-1 text-[16px] leading-7 text-white outline-none placeholder:text-white/38 disabled:opacity-60"
              />
            </div>

            <button
              onClick={send}
              disabled={!canSend}
              className={cls(
                "mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95",
                canSend ? "bg-emerald-300 text-[#102016] shadow-[0_0_22px_rgba(102,185,108,0.34)]" : "bg-white/8 text-white/30"
              )}
              type="button"
              aria-label="Verstuur"
              title={disabledReason || `${textLength}/1500`}
            >
              <SendIcon />
            </button>
          </div>

          <div className="mt-1 flex justify-end text-[10px] text-white/32">{textLength}/1500</div>
        </div>
      </div>
    </section>
  );
}
