import Link from "next/link";
import SafetyMenu from "@/components/SafetyMenu";
import UnlockPipsSmall from "./UnlockPipsSmall";
import type { ChatOther, PresenceLabel } from "./types";
import { cls } from "./utils";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

type Props = {
  other: ChatOther;
  locked: boolean;
  lockedAvatarSrc: string;
  avatarOk: boolean;
  setAvatarOk: (ok: boolean) => void;
  streakDays: number;
  presence: PresenceLabel;
  intentLabel: string | null;
  religionLabel: string | null;
  unlockTotal: number;
  remaining: number;
  remainingLabel: string;
  isArchived: boolean;
  otherTyping: boolean;
  matchId: string;
  archivedAt: string | null;
  headerGlow: string;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  setInfoOpen: (open: boolean) => void;
  setToolsOpen: (open: boolean) => void;
  archiveChat: () => void;
  unmatchNow: () => void;
};

export default function ChatHeader({
  other,
  locked,
  lockedAvatarSrc,
  avatarOk,
  setAvatarOk,
  streakDays,
  presence,
  unlockTotal,
  remaining,
  remainingLabel,
  isArchived,
  otherTyping,
  matchId,
  archivedAt,
  headerGlow,
  menuOpen,
  setMenuOpen,
  setInfoOpen,
  setToolsOpen: _setToolsOpen,
  archiveChat,
  unmatchNow,
}: Props) {
  return (
    <header className={cls("sticky top-0 z-40 border-b border-white/10 bg-[#1e1b27]/96 text-white shadow-[0_14px_36px_rgba(0,0,0,0.36)] backdrop-blur-xl", headerGlow)}>
      <div className="mx-auto flex min-h-[74px] max-w-3xl items-center gap-2 px-3 pt-[calc(0.25rem+env(safe-area-inset-top))]">
        <Link href="/chat" aria-label="Terug naar chats" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/88 hover:text-white active:scale-95">
          <BackIcon />
        </Link>

        <button type="button" onClick={() => setInfoOpen(true)} className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-1 py-1 text-left active:scale-[0.99]" aria-label={`Info over ${other.name}`}>
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/24">
            <img
              src={locked ? lockedAvatarSrc : other.avatar}
              alt=""
              className={cls("h-full w-full", locked ? "scale-110 object-cover blur-[8px]" : other.avatar === "/logo.png" ? "object-contain p-2" : "object-cover")}
              onError={() => setAvatarOk(false)}
            />
            {!avatarOk ? <img src="/logo.png" alt="Depth" className="absolute inset-0 h-full w-full object-contain p-2" /> : null}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="truncate text-[17px] font-semibold leading-tight text-white">{other.name}</div>
              {streakDays > 0 ? <span className="text-xs">🔥{streakDays}</span> : null}
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-white/55">
              {other.age || other.city ? <span className="truncate">{other.age ? `${other.age}j` : ""}{other.age && other.city ? " · " : ""}{other.city}</span> : null}
              {presence ? <span className="truncate">· {presence.text}</span> : null}
              {otherTyping && !isArchived ? <span className="text-emerald-300">· typt…</span> : null}
            </div>
          </div>
        </button>

        <button type="button" onClick={() => setInfoOpen(true)} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 hover:bg-white/10 sm:inline-flex" aria-label="Matchinfo">
          <InfoIcon />
        </button>

        <div className="relative shrink-0" data-chat-menu>
          <button onClick={() => setMenuOpen((v) => !v)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-white/80 hover:text-white" title="Menu" type="button" aria-label="Menu">
            ⋮
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-12 z-50 w-[250px] overflow-hidden rounded-2xl border border-white/10 bg-[#1e1b27] text-white shadow-2xl">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (!isArchived) void archiveChat();
                }}
                disabled={isArchived}
                className={cls("w-full px-4 py-3 text-left text-sm font-semibold", isArchived ? "text-white/40" : "text-white/85 hover:bg-white/5")}
              >
                Chat archiveren
              </button>
              <div className="h-px bg-white/10" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  void unmatchNow();
                }}
                className="w-full px-4 py-3 text-left text-sm font-semibold text-rose-200 hover:bg-rose-400/10"
              >
                Ontmatchen
              </button>
              <div className="h-px bg-white/10" />
              <div className="px-2 py-2">
                <SafetyMenu otherUserId={other.id} matchId={matchId} context="chat" />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 pb-2 text-[11px] text-white/55">
        <button type="button" onClick={() => setInfoOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/18 px-2.5 py-1 font-semibold text-white/70">
          <UnlockPipsSmall total={unlockTotal} remaining={remaining} isUnlocked={!locked} />
          <span>{remainingLabel}</span>
        </button>
        {isArchived ? <span>Gearchiveerd{archivedAt ? ` · ${new Date(archivedAt).toLocaleDateString("nl-BE")}` : ""}</span> : null}
      </div>
    </header>
  );
}
