import type { ChatSlotsUi, LockFilter, SlotMeta, Thread, UnreadFilter } from "./ChatListTypes";

export const UNLOCK_ALTERNATIONS_TOTAL = 5;

export function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function dayKeyBrussels(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function isSameDay(a: Date, b: Date) {
  return dayKeyBrussels(a) === dayKeyBrussels(b);
}

function isYesterday(d: Date, now: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const y = new Date(now.getTime() - oneDay);
  return dayKeyBrussels(d) === dayKeyBrussels(y);
}

function weekdayNL(d: Date) {
  const s = new Intl.DateTimeFormat("nl-BE", { weekday: "long", timeZone: "Europe/Brussels" }).format(d);
  return s.toLowerCase();
}

export function formatThreadStamp(d: Date, now: Date) {
  if (isSameDay(d, now)) return fmtTime(d);
  if (isYesterday(d, now)) return `gisteren ${fmtTime(d)}`;

  const diffDays = Math.floor(
    (new Date(dayKeyBrussels(now)).getTime() - new Date(dayKeyBrussels(d)).getTime()) / (24 * 60 * 60 * 1000)
  );
  if (diffDays >= 2 && diffDays <= 6) return `${weekdayNL(d)} ${fmtTime(d)}`;

  const parts = new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Brussels",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("day")}/${get("month")} ${fmtTime(d)}`;
}

export function filterAndSortThreads({
  threads,
  q,
  unreadFilter,
  lockFilter,
}: {
  threads: Thread[];
  q: string;
  unreadFilter: UnreadFilter;
  lockFilter: LockFilter;
}) {
  const term = q.trim().toLowerCase();

  const filtered = threads
    .filter((t) => (unreadFilter === "unread" ? t.unreadCount > 0 : true))
    .filter((t) => {
      if (lockFilter === "locked") return !t.isUnlocked;
      if (lockFilter === "unlocked") return t.isUnlocked;
      return true;
    })
    .filter((t) => {
      if (!term) return true;
      const hay = `${t.otherName} ${t.otherCity} ${t.lastMessageText || ""}`.toLowerCase();
      return hay.includes(term);
    });

  const active = filtered.filter((t) => !t.isArchived);
  const archived = filtered.filter((t) => t.isArchived);
  const now = new Date();

  function sortKey(t: Thread) {
    const isNewMatch = !t.hasMessages;
    const pinScore =
      (isNewMatch ? 2 : 0) +
      (t.lastMessageFromOther && t.unreadCount === 0 ? 1 : 0) +
      (t.unreadCount > 0 ? 3 : 0);
    const ts = t.updatedAt
      ? new Date(t.updatedAt).getTime()
      : t.lastMessageAt
        ? new Date(t.lastMessageAt).getTime()
        : 0;
    return { pinScore, ts };
  }

  active.sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    if (kb.pinScore !== ka.pinScore) return kb.pinScore - ka.pinScore;
    if (kb.ts !== ka.ts) return kb.ts - ka.ts;
    return a.matchId.localeCompare(b.matchId);
  });

  const activeCount = threads.filter((t) => !t.isArchived).length;

  return { active, archived, activeCount, now };
}

export function buildSlotsUi(meta: SlotMeta | null, activeCount: number): ChatSlotsUi {
  const free = meta?.freeSlots ?? 5;
  const locked = meta?.lockedSlots ?? 2;
  const unlockedExtra = meta?.unlockedExtra ?? 0;
  const availableActiveSlots = meta?.availableActiveSlots ?? free;
  const activeUsed = meta?.activeUsed ?? activeCount;

  const pills: ChatSlotsUi["pills"] = [];

  for (let i = 0; i < free; i++) {
    pills.push({
      key: `free-${i}`,
      label: i < activeUsed ? "Bezet" : "Vrij",
      state: i < activeUsed ? "filled" : "free",
    });
  }

  for (let i = 0; i < locked; i++) {
    const slotIndex = free + i + 1; // 6..7
    const unlocked = slotIndex <= availableActiveSlots;
    const filled = activeUsed >= slotIndex;
    if (!unlocked) pills.push({ key: `locked-${i}`, label: "Extra", state: "locked" });
    else pills.push({ key: `extra-${i}`, label: filled ? "Bezet" : "Vrij", state: "extra" });
  }

  const waitingText = (() => {
    const queued = meta?.queuedCount ?? 0;
    const waiting = meta?.waitingCount ?? 0;
    if (queued <= 0) return null;
    if (waiting <= 0) {
      return `${queued} match${queued === 1 ? "" : "es"} staat${queued === 1 ? "" : "en"} klaar en wordt zichtbaar zodra je pagina herlaadt.`;
    }
    return `${waiting} match${waiting === 1 ? "" : "es"} wacht${waiting === 1 ? "" : "en"} op een vrij slot.`;
  })();

  return {
    free,
    locked,
    unlockedExtra,
    availableActiveSlots,
    activeUsed,
    hardCap: meta?.hardCap ?? free + locked,
    queuedCount: meta?.queuedCount ?? 0,
    waitingText,
    pills,
  };
}
