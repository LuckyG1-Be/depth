export type Pack = {
  key: string;
  title: string;
  subtitle: string;
  tokens: number;
  amountCents: number;
  currency: "EUR";
  priceLabel: string;
  highlight?: boolean;
};

export type LedgerItem = {
  id: string;
  createdAt: string;
  delta: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  note: string | null;
  idemKey: string | null;
};

export type SnapshotApi = {
  ok: boolean;
  wallet?: { balance?: number; availableTotal?: number };
  free?: { used?: number; remaining?: number; total?: number };
  lifestyleFilters?: { active?: boolean; activeUntil?: string | null };
  matchSlotExtension?: {
    active?: boolean;
    activeCount?: number;
    endsAt?: string | null;
    endsAtList?: string[];
  };
  ledger?: LedgerItem[];
  ledgerPage?: {
    initialLimit?: number;
    total?: number;
    hasMore?: boolean;
    nextOffset?: number;
  };
  purchases?: Array<{
    id: string;
    createdAt: string;
    status: string;
    tokens: number;
    amountCents: number;
    provider: string;
    providerRef: string | null;
    paidAt: string | null;
  }>;
};

export type Snapshot = {
  ok: boolean;
  balance: number;
  availableTotal: number;
  freeUsed: number;
  freeRemaining: number;
  freeTotal: number;
  lifestyleActive: boolean;
  lifestyleUntil: string | null;
  matchExtActive: boolean;
  matchExtActiveCount: number;
  matchExtEndsAt: string | null;
  matchExtEndsAtList: string[];
  ledger: LedgerItem[];
  ledgerHasMore: boolean;
  ledgerNextOffset: number;
  ledgerTotal: number;
  purchases: NonNullable<SnapshotApi["purchases"]>;
};

export type ToolCostItem = { toolKey: string; cost: number };

export type LimitsApi = {
  ok: boolean;
  free?: { total?: number; used?: number; remaining?: number };
  matchSlots?: {
    base?: number;
    cap?: number;
    extensionActive?: boolean;
    extensionEndsAt?: string | null;
    extensionCost?: number;
    extensionHours?: number;
    extraMax?: number;
    extraActive?: number;
  };
  lifestyleFilters?: {
    cost?: number;
    durationDays?: number;
  };
  toolCosts?: ToolCostItem[] | Record<string, number>;
  packs?: Pack[];
};

export type Limits = {
  ok: boolean;
  freeTotal: number;
  freeUsed: number;
  freeRemaining: number;
  toolCosts: ToolCostItem[];
  matchSlotsBase: number;
  matchSlotsCap: number;
  matchSlotsExtActive: boolean;
  matchSlotsExtEndsAt: string | null;
  matchSlotCost: number;
  matchSlotHours: number;
  matchSlotExtraMax: number;
  matchSlotExtraActive: number;
  lifestyleFiltersCost: number;
  lifestyleFiltersDurationDays: number;
  packs: Pack[];
};

export type PurchaseStatusResp = {
  ok: boolean;
  purchase: {
    id: string;
    status: string;
    tokens: number;
    amountCents: number;
    provider: string;
    providerRef: string | null;
    paidAt: string | null;
    createdAt: string;
  };
  wallet: { balance: number };
};

export type StartResp = {
  ok: boolean;
  purchaseId?: string;
  checkoutUrl?: string;
  error?: string;
};

export type ExtendResp =
  | { ok: true; mode: "CREATED" | "IDEMPOTENT" | "ALREADY_ACTIVE"; endsAt: string; balance: number }
  | { ok: false; error: "INSUFFICIENT_TOKENS" | "BAD_REQUEST" | string; balance?: number };

export type LifestyleResp =
  | { ok: true; activeUntil?: string; alreadyActive?: boolean; balance?: number }
  | { ok: false; error?: string };

export type LedgerMoreResp = {
  ok: boolean;
  items: LedgerItem[];
  page: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
    nextOffset: number;
  };
};
