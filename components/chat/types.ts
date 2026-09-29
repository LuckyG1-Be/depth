export type Msg = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: string | Date;
  isRead?: boolean;
  readAt?: string | Date | null;
};

export type QA = { q: string; a: string };

export type ChatMatch = {
  id: string;
  isUnlocked: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  unlockedAt?: string | null;
};

export type ChatOther = {
  id: string;
  name: string;
  city: string;
  age?: number | null;
  lastSeenAt: string | null;
  intent: string | null;
  religion: string | null;
  values: string[];
  passions: string[];
  qa: QA[];
  photoIds: string[];
  allPhotoIds?: string[];
  avatar: string;
};

export type ChatInitial = {
  messages: Msg[];
  isUnlocked: boolean;
  remaining: number;
  unlockTotal?: number;
  streakDays?: number;
  lastMsgAt?: string | null;
};

export type ChatViewProps = {
  match: ChatMatch;
  meId: string;
  other: ChatOther;
  initial: ChatInitial;
};

export type PresenceLabel = { text: string; tone: "online" | "recent" | "ago" } | null;

export type PollResp = {
  ok?: boolean;
  isArchived?: boolean;
  archivedAt?: string | null;
  messages?: Msg[];
  unlock?: { isUnlocked?: boolean; remaining?: number; alternations?: number; unlockedAt?: string | null };
};
