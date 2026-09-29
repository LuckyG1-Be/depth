"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import DepthToolRunnerModal, { type ToolSession } from "@/components/premium/DepthToolRunnerModal";
import DepthToolsModal from "@/components/premium/DepthToolsModal";
import ChatConversationPanel from "@/components/chat/ChatConversationPanel";
import ChatHeader from "@/components/chat/ChatHeader";
import InfoModal from "@/components/chat/InfoModal";
import PhotoModal from "@/components/chat/PhotoModal";
import UnlockCinematic from "@/components/chat/UnlockCinematic";
import type { ConversationCoach } from "@/components/chat/useConversationCoach";
import type { ChatOther, Msg, PresenceLabel } from "@/components/chat/types";

export type ChatViewLayoutProps = {
  modalSrc: string | null;
  setModalSrc: (value: string | null) => void;
  infoOpen: boolean;
  setInfoOpen: Dispatch<SetStateAction<boolean>>;
  toolsOpen: boolean;
  setToolsOpen: Dispatch<SetStateAction<boolean>>;
  runnerOpen: boolean;
  setRunnerOpen: Dispatch<SetStateAction<boolean>>;
  toolSession: ToolSession | null;
  setToolSession: Dispatch<SetStateAction<ToolSession | null>>;
  startDepthTool: (toolKey: string) => Promise<void> | void;
  sendDepthToolResult: (value: string) => Promise<void> | void;
  showCinematic: boolean;
  setShowCinematic: Dispatch<SetStateAction<boolean>>;
  cinematicConfetti: boolean;
  setCinematicConfetti: Dispatch<SetStateAction<boolean>>;
  prefHaptics: boolean;
  setPrefHaptics: Dispatch<SetStateAction<boolean>>;
  prefSound: boolean;
  setPrefSound: Dispatch<SetStateAction<boolean>>;
  other: ChatOther;
  matchId: string;
  locked: boolean;
  lockedAvatarSrc: string;
  avatarOk: boolean;
  setAvatarOk: Dispatch<SetStateAction<boolean>>;
  streakDays: number;
  presence: PresenceLabel;
  intentLabel: string | null;
  religionLabel: string | null;
  unlockTotal: number;
  remaining: number;
  remainingLabel: string;
  isArchived: boolean;
  isUnlocked: boolean;
  otherTyping: boolean;
  archivedAt: string | null;
  headerGlow: string;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  archiveChat: () => Promise<void> | void;
  unmatchNow: () => Promise<void> | void;
  unlockedThumbs: string[];
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
  text: string;
  sending: boolean;
  sendError: string | null;
  canSend: boolean;
  quickReplies: string[];
  conversationCoach: ConversationCoach;
  setText: (value: string) => void;
  scrollToBottom: (smooth?: boolean) => void;
  loadOlder: () => Promise<void> | void;
  send: () => Promise<void> | void;
  insertQuickReply: (value: string) => void;
  onBubblePressStart: (id: string) => void;
  onBubblePressEnd: () => void;
};

export default function ChatViewLayout({
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
  sendDepthToolResult,
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
}: ChatViewLayoutProps) {
  return (
    <main className="min-h-[100dvh] bg-[#1e1b27] text-white">
      <PhotoModal open={!!modalSrc} onClose={() => setModalSrc(null)} src={modalSrc || ""} />
      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        other={other}
        locked={locked}
        remaining={remaining}
        unlockTotal={unlockTotal}
        isUnlocked={isUnlocked}
        unlockedThumbs={unlockedThumbs}
        setModalSrc={setModalSrc}
      />

      <DepthToolsModal open={toolsOpen} onClose={() => setToolsOpen(false)} matchId={matchId} onStart={startDepthTool} />

      <DepthToolRunnerModal
        open={runnerOpen}
        session={toolSession}
        otherName={other.name}
        onClose={() => {
          setRunnerOpen(false);
          setToolSession(null);
        }}
        onFinish={async (resultText) => {
          await sendDepthToolResult(resultText);
          setRunnerOpen(false);
          setToolSession(null);
        }}
      />

      <UnlockCinematic
        open={showCinematic}
        name={other.name}
        previewSrcs={unlockedThumbs.slice(0, 3)}
        onDone={() => {
          setShowCinematic(false);
          setCinematicConfetti(false);
        }}
        playHaptics={prefHaptics}
        playSound={prefSound}
        showConfetti={cinematicConfetti}
        setPlayHaptics={setPrefHaptics}
        setPlaySound={setPrefSound}
      />

      <ChatHeader
        other={other}
        locked={locked}
        lockedAvatarSrc={lockedAvatarSrc}
        avatarOk={avatarOk}
        setAvatarOk={setAvatarOk}
        streakDays={streakDays}
        presence={presence}
        intentLabel={intentLabel}
        religionLabel={religionLabel}
        unlockTotal={unlockTotal}
        remaining={remaining}
        remainingLabel={remainingLabel}
        isArchived={isArchived}
        otherTyping={otherTyping}
        matchId={matchId}
        archivedAt={archivedAt}
        headerGlow={headerGlow}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        setInfoOpen={setInfoOpen}
        setToolsOpen={setToolsOpen}
        archiveChat={archiveChat}
        unmatchNow={unmatchNow}
      />

      <ChatConversationPanel
        scrollerRef={scrollerRef}
        textareaRef={textareaRef}
        messages={messages}
        meId={meId}
        loadingOlder={loadingOlder}
        hasMoreOlder={hasMoreOlder}
        firstId={firstId}
        newSinceBottom={newSinceBottom}
        forceTimeIds={forceTimeIds}
        coarse={coarse}
        isUnlocked={isUnlocked}
        text={text}
        sending={sending}
        isArchived={isArchived}
        sendError={sendError}
        canSend={canSend}
        quickReplies={quickReplies}
        conversationCoach={conversationCoach}
        otherName={other.name}
        locked={locked}
        remaining={remaining}
        unlockTotal={unlockTotal}
        setText={setText}
        scrollToBottom={scrollToBottom}
        loadOlder={loadOlder}
        send={send}
        onQuickReply={insertQuickReply}
        onOpenTools={() => setToolsOpen(true)}
        onBubblePressStart={onBubblePressStart}
        onBubblePressEnd={onBubblePressEnd}
      />
    </main>
  );
}
