export type Thread = {
  matchId: string;
  otherUserId: string;
  otherName: string;
  otherCity: string;
  otherLastSeenAt?: string | null;

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

  unlockRemaining?: number;
  unlockTotal?: number;

  superlike?: boolean;
  streakDays?: number;

  updatedAt?: string | null;
};

export type SlotMeta = {
  freeSlots: number;
  lockedSlots: number;
  unlockedExtra: number;
  availableActiveSlots: number;
  hardCap: number;
  activeUsed: number;
  queuedCount: number;
  waitingCount: number;
};

export type UnreadFilter = "all" | "unread";
export type LockFilter = "all" | "locked" | "unlocked";

export type SlotPillState = "filled" | "free" | "locked" | "extra";

export type SlotPillModel = {
  key: string;
  label: string;
  state: SlotPillState;
};

export type ChatSlotsUi = {
  free: number;
  locked: number;
  unlockedExtra: number;
  availableActiveSlots: number;
  activeUsed: number;
  hardCap: number;
  queuedCount: number;
  waitingText: string | null;
  pills: SlotPillModel[];
};
