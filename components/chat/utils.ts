import type { Msg, PresenceLabel } from "./types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function fmtTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function labelIntent(raw: string | null | undefined) {
  if (!raw) return null;
  const v = String(raw).trim();

  const map: Record<string, string> = {
    RELATIONSHIP: "Serieuze relatie",
    SERIOUS: "Serieuze relatie",
    SERIOUS_RELATIONSHIP: "Serieuze relatie",
    LONG_TERM: "Serieuze relatie",

    CASUAL: "Casual",
    FRIENDSHIP: "Vriendschap",
    FRIENDS: "Vriendschap",

    LOOKING: "Nog aan het kijken",
    STILL_LOOKING: "Nog aan het kijken",
    UNDECIDED: "Nog aan het kijken",
    NOT_SURE: "Nog aan het kijken",
  };

  return map[v] || v;
}

export function labelReligion(raw: string | null | undefined) {
  if (!raw) return null;
  const v = String(raw).trim();
  const map: Record<string, string> = {
    NONE: "Geen",
    CHRISTIAN: "Christelijk",
    ISLAM: "Islam",
    JEWISH: "Joods",
    HINDU: "Hindoe",
    BUDDHIST: "Boeddhist",
    OTHER: "Anders",
  };
  return map[v] || v;
}

// Hydration-safe: do not render presence on SSR / first client render (now===0).
export function presenceLabel(lastSeenAt: string | null, now: number): PresenceLabel {
  if (!lastSeenAt) return null;
  if (!now) return null;

  const t = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(t)) return null;

  const diffMs = now - t;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin <= 2) return { text: "Online", tone: "online" };
  if (diffMin < 60) return { text: `Actief ${diffMin} min geleden`, tone: "recent" };

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return { text: `Actief ${diffH}u geleden`, tone: "ago" };

  const d = new Date(t);
  return { text: `Actief op ${d.toLocaleDateString("nl-BE")}`, tone: "ago" };
}

export function neutralizeIfLocked(text: string, locked: boolean) {
  if (!locked) return text;

  let t = text;
  t = t.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, "");
  t = t.replace(/\bhttps?:\/\//gi, (m) => (m.toLowerCase().startsWith("https") ? "hxxps://" : "hxxp://"));
  t = t.replace(/\bwww\./gi, "w\u200Bw.");
  t = t.replace(/\b([a-z0-9-]+)\.([a-z]{2,})(\b|\/)/gi, (_m, a, b, tail) => `${a}[.]${b}${tail}`);
  t = t.replace(/(^|\s)@([a-z0-9_]{2,32})\b/gi, (_m, pre, u) => `${pre}@\u200B${u}`);
  return t;
}

export function sortByCreatedAsc(xs: Msg[]) {
  return [...xs].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });
}

export function mergeById(prev: Msg[], incoming: Msg[]) {
  if (!incoming.length) return prev;
  const map = new Map<string, Msg>();
  for (const m of prev) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return sortByCreatedAsc(Array.from(map.values()));
}

type NavigatorWithVibrate = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

type AudioContextConstructor = new () => AudioContext;

type WindowWithAudioContext = Window & {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
};

export function vib(ms: number) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const nav = navigator as NavigatorWithVibrate;
      nav.vibrate?.(ms);
    }
  } catch {}
}

export function tinyChime() {
  try {
    const win = window as WindowWithAudioContext;
    const AudioCtx = win.AudioContext || win.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(523.25, now);
    o1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
    g1.gain.setValueAtTime(0.0001, now);
    g1.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o1.connect(g1);
    g1.connect(ctx.destination);
    o1.start(now);
    o1.stop(now + 0.24);

    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(1046.5, now + 0.02);
    g2.gain.setValueAtTime(0.0001, now + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.07, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    o2.connect(g2);
    g2.connect(ctx.destination);
    o2.start(now + 0.02);
    o2.stop(now + 0.22);

    setTimeout(() => {
      try {
        ctx.close?.();
      } catch {}
    }, 500);
  } catch {}
}

export function dayKeyBrussels(d: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isSameDayBrussels(a: Date, b: Date) {
  return dayKeyBrussels(a) === dayKeyBrussels(b);
}
