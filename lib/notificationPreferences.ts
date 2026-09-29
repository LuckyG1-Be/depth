import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type NotificationPreferenceKey =
  | "chat"
  | "matches"
  | "likes"
  | "verification"
  | "wallet"
  | "safety"
  | "product";

export type NotificationPreferenceChannel = "inApp" | "email";

export type NotificationPreferences = Record<NotificationPreferenceChannel, Record<NotificationPreferenceKey, boolean>>;

type ConfigClient = Prisma.TransactionClient | typeof prisma;

const ALL_KEYS: NotificationPreferenceKey[] = ["chat", "matches", "likes", "verification", "wallet", "safety", "product"];

export function notificationPrefsKey(userId: string) {
  return `USER_NOTIFICATION_PREFS:${userId}`;
}

export function defaultNotificationPreferences(): NotificationPreferences {
  return {
    inApp: {
      chat: true,
      matches: true,
      likes: true,
      verification: true,
      wallet: true,
      safety: true,
      product: true,
    },
    email: {
      chat: false,
      matches: true,
      likes: false,
      verification: true,
      wallet: true,
      safety: true,
      product: false,
    },
  };
}

function boolOrDefault(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeNotificationPreferences(raw: unknown): NotificationPreferences {
  const defaults = defaultNotificationPreferences();
  const source = raw && typeof raw === "object" ? (raw as Partial<NotificationPreferences>) : {};

  const result = defaultNotificationPreferences();
  for (const channel of ["inApp", "email"] as const) {
    const channelSource = source[channel] && typeof source[channel] === "object" ? source[channel] : {};
    for (const key of ALL_KEYS) {
      result[channel][key] = boolOrDefault((channelSource as Partial<Record<NotificationPreferenceKey, boolean>>)[key], defaults[channel][key]);
    }
  }
  return result;
}

export function parseNotificationPreferences(value: string | null | undefined): NotificationPreferences {
  if (!value) return defaultNotificationPreferences();
  try {
    return normalizeNotificationPreferences(JSON.parse(value));
  } catch {
    return defaultNotificationPreferences();
  }
}

export async function getNotificationPreferences(userId: string, client: ConfigClient = prisma): Promise<NotificationPreferences> {
  const row = await client.appConfig.findUnique({ where: { key: notificationPrefsKey(userId) }, select: { value: true } });
  return parseNotificationPreferences(row?.value);
}

export async function saveNotificationPreferences(userId: string, prefs: NotificationPreferences, client: ConfigClient = prisma): Promise<NotificationPreferences> {
  const normalized = normalizeNotificationPreferences(prefs);
  await client.appConfig.upsert({
    where: { key: notificationPrefsKey(userId) },
    create: { key: notificationPrefsKey(userId), value: JSON.stringify(normalized) },
    update: { value: JSON.stringify(normalized) },
  });
  return normalized;
}

export function mergeNotificationPreferences(current: NotificationPreferences, patch: Partial<NotificationPreferences>): NotificationPreferences {
  const merged = normalizeNotificationPreferences(current);
  for (const channel of ["inApp", "email"] as const) {
    const channelPatch = patch[channel];
    if (!channelPatch || typeof channelPatch !== "object") continue;
    for (const key of ALL_KEYS) {
      if (typeof channelPatch[key] === "boolean") merged[channel][key] = channelPatch[key]!;
    }
  }
  return merged;
}

export const NOTIFICATION_PREF_LABELS: Record<NotificationPreferenceKey, { title: string; description: string }> = {
  chat: { title: "Chatberichten", description: "Nieuwe berichten en actieve gesprekken." },
  matches: { title: "Matches", description: "Nieuwe matches en match-wachtrij." },
  likes: { title: "Likes & dieptesignalen", description: "Ontvangen likes en superlikes." },
  verification: { title: "Verificatie", description: "Goedkeuring, afwijzing of opnieuw indienen." },
  wallet: { title: "Wallet & betalingen", description: "Aankopen, tokens en open betalingen." },
  safety: { title: "Safety", description: "Reports, blokkeringen of tijdelijke chatbeperkingen." },
  product: { title: "Depth-updates", description: "Rustige product- en bèta-updates." },
};

export const NOTIFICATION_PREF_KEYS = ALL_KEYS;
