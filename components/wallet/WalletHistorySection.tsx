import type { LedgerItem, Snapshot } from "./types";
import { cls, fmtDateTimeNL, ledgerReasonLabel, moneyEUR, statusBadge } from "./utils";

type Props = {
  snapshot: Snapshot | null;
  ledgerItems: LedgerItem[];
  ledgerHasMore: boolean;
  ledgerLoadingMore: boolean;
  loadMoreLedger: () => void;
};

export default function WalletHistorySection({ snapshot, ledgerItems, ledgerHasMore, ledgerLoadingMore, loadMoreLedger }: Props) {
  const recentPurchases = snapshot?.purchases?.slice(0, 2) ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/85">Aankopen</div>
            <div className="mt-1 text-xs text-white/45">Je recentste tokenpakketten.</div>
          </div>
          {snapshot?.purchases?.length ? <div className="text-xs text-white/42">{snapshot.purchases.length} recent</div> : null}
        </div>

        <div className="mt-3 space-y-2">
          {!recentPurchases.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/55">Nog geen aankopen.</div>
          ) : (
            recentPurchases.map((p) => (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white/85">
                      {p.tokens} tokens • {moneyEUR(p.amountCents)}
                    </div>
                    <div className="mt-1 text-xs text-white/55">{fmtDateTimeNL(p.createdAt)}</div>
                  </div>

                  <div className={cls("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusBadge(p.status))}>{String(p.status || "").toUpperCase()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/85">Transacties</div>
            <div className="mt-1 text-xs text-white/45">Gebruik en correcties.</div>
          </div>
          {snapshot?.ledgerTotal ? <div className="text-xs text-white/45">{Math.min(ledgerItems.length, snapshot.ledgerTotal)} van {snapshot.ledgerTotal}</div> : null}
        </div>

        <div className="mt-3 space-y-2">
          {!ledgerItems.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/55">Nog geen transacties.</div>
          ) : (
            ledgerItems.map((l) => {
              const plus = l.delta > 0;
              return (
                <div key={l.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/85">{ledgerReasonLabel(l.reason, l.note)}</div>
                      <div className="mt-1 text-xs text-white/55">{fmtDateTimeNL(l.createdAt)}</div>
                    </div>

                    <div className={cls("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold", plus ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-white/70")}>
                      {plus ? `+${l.delta}` : String(l.delta)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {ledgerHasMore ? (
          <button
            type="button"
            onClick={() => void loadMoreLedger()}
            disabled={ledgerLoadingMore}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 disabled:opacity-60"
          >
            {ledgerLoadingMore ? "Laden…" : "Toon meer"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
