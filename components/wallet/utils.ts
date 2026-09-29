import type { Limits, Pack, Snapshot, ToolCostItem } from "./types";

export const GREEN = "#66b96c";

export const TOOL_LABELS: Record<string, string> = {
  TEGENPOLEN_DUEL: "Tegenpolen Duel",
  SCENARIO_SPIEGEL: "Scenario Spiegel",
  VERHALEN_DRIE_ZINNEN: "Verhalen in 3 zinnen",
  RELATIE_KOMPAS: "Relatie Kompas",
  MATCH_SLOT_EXTENSION: "Match-slot uitbreiding",
  LIFESTYLE_FILTERS: "Lifestyle-filters",
};

export const TOOL_DESCRIPTIONS: Record<string, string> = {
  RELATIE_KOMPAS: "Plaats jullie relatietempo, ruimte, avontuur en conflictstijl naast elkaar.",
  SCENARIO_SPIEGEL: "Test hoe jullie reageren op herkenbare situaties rond initiatief, spanning en nabijheid.",
  TEGENPOLEN_DUEL: "Maak verschillen zichtbaar via snelle keuzes rond structuur, openheid en gevoel.",
  VERHALEN_DRIE_ZINNEN: "Schrijf elk een mini-verhaal. De toon en afloop geven verrassend veel weg.",
  LIFESTYLE_FILTERS: "Gebruik extra voorkeuren zoals opleiding, roken, drinken en beweging in Discover.",
  MATCH_SLOT_EXTENSION: "Maak tijdelijk extra ruimte wanneer er een match klaarstaat maar je actieve slots vol zitten.",
};

export const TOOL_ORDER = [
  "RELATIE_KOMPAS",
  "SCENARIO_SPIEGEL",
  "TEGENPOLEN_DUEL",
  "VERHALEN_DRIE_ZINNEN",
  "LIFESTYLE_FILTERS",
  "MATCH_SLOT_EXTENSION",
] as const;

export const CHAT_TOOL_KEYS = [
  "RELATIE_KOMPAS",
  "SCENARIO_SPIEGEL",
  "TEGENPOLEN_DUEL",
  "VERHALEN_DRIE_ZINNEN",
] as const;

export const WALLET_FEATURE_KEYS = ["LIFESTYLE_FILTERS", "MATCH_SLOT_EXTENSION"] as const;

export function randomIdemKey(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function readJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type JsonRecord = Record<string, unknown>;

type LedgerItemLike = Snapshot["ledger"][number];
type PurchaseLike = Snapshot["purchases"][number];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordField(source: JsonRecord, key: string): JsonRecord | null {
  const value = source[key];
  return isRecord(value) ? value : null;
}

function numberField(source: JsonRecord | null, key: string, fallback: number): number {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringOrNull(value: unknown): string | null {
  return value ? String(value) : null;
}

function isToolCostItem(value: unknown): value is ToolCostItem {
  return isRecord(value) && typeof value.toolKey === "string" && typeof value.cost === "number";
}

function isPack(value: unknown): value is Pack {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    typeof value.title === "string" &&
    typeof value.subtitle === "string" &&
    typeof value.tokens === "number" &&
    typeof value.amountCents === "number" &&
    value.currency === "EUR" &&
    typeof value.priceLabel === "string"
  );
}

function isLedgerItem(value: unknown): value is LedgerItemLike {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.delta === "number" &&
    typeof value.reason === "string" &&
    (typeof value.refType === "string" || value.refType === null) &&
    (typeof value.refId === "string" || value.refId === null) &&
    (typeof value.note === "string" || value.note === null) &&
    (typeof value.idemKey === "string" || value.idemKey === null)
  );
}

function isPurchase(value: unknown): value is PurchaseLike {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.status === "string" &&
    typeof value.tokens === "number" &&
    typeof value.amountCents === "number" &&
    typeof value.provider === "string" &&
    (typeof value.providerRef === "string" || value.providerRef === null) &&
    (typeof value.paidAt === "string" || value.paidAt === null)
  );
}

function isToolCostRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "number");
}

export function normalizeToolCosts(input: unknown): ToolCostItem[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter(isToolCostItem).map((x) => ({ toolKey: x.toolKey, cost: x.cost }));
  }
  if (isToolCostRecord(input)) {
    return Object.entries(input).map(([toolKey, cost]) => ({ toolKey, cost }));
  }
  return [];
}

export function normalizeSnapshot(raw: unknown): Snapshot | null {
  if (!isRecord(raw) || raw.ok !== true) return null;

  const wallet = recordField(raw, "wallet");
  const balance = numberField(wallet, "balance", Number.NaN);
  if (!Number.isFinite(balance)) return null;

  const free = recordField(raw, "free");
  const freeUsed = numberField(free, "used", 0);
  const freeRemaining = numberField(free, "remaining", 0);
  const freeTotal = numberField(free, "total", 0);

  const availableTotal = numberField(wallet, "availableTotal", balance + freeRemaining);

  const matchSlotExtension = recordField(raw, "matchSlotExtension");
  const matchExtActive = Boolean(matchSlotExtension?.active);
  const matchExtActiveCount = numberField(matchSlotExtension, "activeCount", matchExtActive ? 1 : 0);
  const matchExtEndsAt = stringOrNull(matchSlotExtension?.endsAt);
  const matchExtEndsAtList = Array.isArray(matchSlotExtension?.endsAtList)
    ? matchSlotExtension.endsAtList.map((x) => String(x))
    : matchExtEndsAt
      ? [matchExtEndsAt]
      : [];

  const lifestyleFilters = recordField(raw, "lifestyleFilters");
  const lifestyleActive = Boolean(lifestyleFilters?.active);
  const lifestyleUntil = stringOrNull(lifestyleFilters?.activeUntil);

  const ledger = Array.isArray(raw.ledger) ? raw.ledger.filter(isLedgerItem) : [];
  const ledgerPage = recordField(raw, "ledgerPage");
  const purchases = Array.isArray(raw.purchases) ? raw.purchases.filter(isPurchase) : [];

  return {
    ok: true,
    balance,
    availableTotal,
    freeUsed,
    freeRemaining,
    freeTotal,
    lifestyleActive,
    lifestyleUntil,
    matchExtActive,
    matchExtActiveCount,
    matchExtEndsAt,
    matchExtEndsAtList,
    ledger,
    ledgerHasMore: Boolean(ledgerPage?.hasMore),
    ledgerNextOffset: numberField(ledgerPage, "nextOffset", ledger.length),
    ledgerTotal: numberField(ledgerPage, "total", ledger.length),
    purchases,
  };
}

export function normalizeLimits(raw: unknown): Limits | null {
  if (!isRecord(raw) || raw.ok !== true) return null;

  const free = recordField(raw, "free");
  const matchSlots = recordField(raw, "matchSlots");
  const lifestyleFilters = recordField(raw, "lifestyleFilters");

  const rawToolCosts = raw.toolCosts;
  const toolCosts = Array.isArray(rawToolCosts) || isToolCostRecord(rawToolCosts) ? normalizeToolCosts(rawToolCosts) : [];

  const freeTotal = numberField(free, "total", 0);
  const freeUsed = numberField(free, "used", 0);
  const freeRemaining = numberField(free, "remaining", 0);

  const matchSlotsBase = numberField(matchSlots, "base", 3);
  const matchSlotsCap = numberField(matchSlots, "cap", matchSlotsBase);
  const matchSlotsExtActive = Boolean(matchSlots?.extensionActive);
  const matchSlotsExtEndsAt = stringOrNull(matchSlots?.extensionEndsAt);

  const matchSlotCost = numberField(matchSlots, "extensionCost", 6);
  const matchSlotHours = numberField(matchSlots, "extensionHours", 24);
  const matchSlotExtraMax = numberField(matchSlots, "extraMax", 2);
  const matchSlotExtraActive = numberField(matchSlots, "extraActive", 0);

  const lifestyleFiltersCost = numberField(lifestyleFilters, "cost", 6);
  const lifestyleFiltersDurationDays = numberField(lifestyleFilters, "durationDays", 28);

  const packs = Array.isArray(raw.packs) ? raw.packs.filter(isPack) : [];

  return {
    ok: true,
    freeTotal,
    freeUsed,
    freeRemaining,
    toolCosts,
    matchSlotsBase,
    matchSlotsCap,
    matchSlotsExtActive,
    matchSlotsExtEndsAt,
    matchSlotCost,
    matchSlotHours,
    matchSlotExtraMax,
    matchSlotExtraActive,
    lifestyleFiltersCost,
    lifestyleFiltersDurationDays,
    packs,
  };
}

export function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function fmtDateTimeNL(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("nl-BE");
}

export function moneyEUR(cents: number) {
  const v = (Number(cents) || 0) / 100;
  try {
    return new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(v);
  } catch {
    return `€ ${v.toFixed(2)}`;
  }
}

export function tokenLabel(count: number) {
  const n = Number(count) || 0;
  return `${n} token${n === 1 ? "" : "s"}`;
}

export function statusBadge(status: string) {
  const s = String(status || "").toUpperCase();
  if (s.includes("PAID") || s === "SUCCEEDED") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (s.includes("OPEN") || s.includes("PENDING")) return "border-white/10 bg-white/5 text-white/70";
  if (s.includes("CANCEL") || s.includes("FAIL") || s.includes("EXPIRE")) return "border-red-500/25 bg-red-500/10 text-red-100";
  return "border-white/10 bg-white/5 text-white/70";
}

export function ledgerReasonLabel(reason: string, note?: string | null) {
  const r = String(reason || "").toUpperCase();
  const n = String(note || "").toUpperCase();
  if (r === "PURCHASE") return "Tokenpakket gekocht";
  if (r === "ADMIN_ADJUST") return "Admin-correctie";
  if (r === "MATCH_SLOT_EXTENSION") return "Match-slot uitbreiding";
  if (r === "LIFESTYLE_FILTERS") return "Lifestyle-filters";
  if (r === "DEPTH_TOOL" || r === "SPEND_DEPTH_TOOL") return TOOL_LABELS[n] ? `Depth-tool: ${TOOL_LABELS[n]}` : "Depth-tool gebruikt";
  return reason || "Wallet-transactie";
}

export function toolNote(key: string, hours: number, durationDays: number) {
  switch (key) {
    case "RELATIE_KOMPAS":
      return "Sliders voor openheid, ruimte, avontuur en verbinding.";
    case "SCENARIO_SPIEGEL":
      return "Korte scenario’s die tonen hoe jullie reageren onder spanning of onduidelijkheid.";
    case "TEGENPOLEN_DUEL":
      return "Snelle keuzes rond tempo, structuur en emotionele stijl.";
    case "VERHALEN_DRIE_ZINNEN":
      return "Een creatieve oefening die toon, humor en spontaniteit blootlegt.";
    case "LIFESTYLE_FILTERS":
      return `${durationDays} dagen extra Discover-filters zoals opleiding, roken, drinken en beweging.`;
    case "MATCH_SLOT_EXTENSION":
      return `Eén extra actief match-slot voor ${hours} uur. Maximaal twee extra slots tegelijk.`;
    default:
      return "Gebruik een Depth-tool om sneller naar echte diepgang te gaan.";
  }
}
