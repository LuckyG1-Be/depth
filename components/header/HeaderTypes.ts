export const GREEN = "#66b96c";
export const BG = "#1e1b27";

export type NotificationTone = "chat" | "match" | "like" | "wallet" | "verify" | "neutral";

export type NotificationItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  count?: number;
  tone: NotificationTone;
  notificationId?: string;
  isStored?: boolean;
};

export type NotificationSummary = {
  ok: boolean;
  badgeCount: number;
  counts: {
    unreadMessages?: number;
    unreadThreads?: number;
    likes?: number;
    superlikes?: number;
    totalLikes?: number;
    newMatches?: number;
    queuedMatches?: number;
    pendingPurchases?: number;
    verificationPending?: boolean;
    verificationNeedsAttention?: boolean;
    verified?: boolean;
    storedNotifications?: number;
  };
  items: NotificationItem[];
  serverTime?: string;
  nextPollMs?: number;
};

export function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function emptySummary(): NotificationSummary {
  return { ok: true, badgeCount: 0, counts: {}, items: [] };
}
