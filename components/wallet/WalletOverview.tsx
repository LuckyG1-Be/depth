import { Gift, Wallet } from "lucide-react";
import DepthTokenIcon from "./DepthTokenIcon";

function StatCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-2 sm:px-4 sm:py-3">
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/42 sm:text-[11px] sm:tracking-[0.16em]">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-white sm:mt-2 sm:text-2xl">{value}</div>
      <div className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-white/50 sm:mt-1 sm:text-xs sm:leading-5">{helper}</div>
    </div>
  );
}

type Props = {
  loading: boolean;
  hasSnapshot: boolean;
  availableTotal: number;
  paidTokens: number;
  freeRemaining: number;
  freeUsed: number;
  freeTotal: number;
  usedPct: number;
};

export default function WalletOverview({ loading, hasSnapshot, availableTotal, paidTokens, freeRemaining, freeUsed, freeTotal, usedPct }: Props) {
  const loadingValue = loading && !hasSnapshot;
  const freeLabel = freeTotal > 0 ? `${freeUsed}/${freeTotal}` : "0/0";

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white/85">Saldo</div>
          <div className="mt-0.5 text-xs leading-5 text-white/55 sm:mt-1 sm:text-sm sm:leading-6">Gratis tokens worden eerst gebruikt.</div>
        </div>

        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 sm:h-12 sm:w-12">
          <DepthTokenIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
      </div>

      <div className="mt-2 flex items-end gap-2 sm:mt-5 sm:gap-3">
        <div className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{loadingValue ? "—" : availableTotal}</div>
        <div className="pb-1 text-xs text-white/55 sm:pb-2 sm:text-sm">beschikbaar</div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-5 sm:gap-3">
        <StatCard label="Betaald" value={loadingValue ? "—" : paidTokens} helper="Tot gebruik." />
        <StatCard label="Gratis" value={loadingValue ? "—" : freeRemaining} helper="Eerst ingezet." />
        <StatCard label="Gebruikt" value={loadingValue ? "—" : freeLabel} helper="Inbegrepen." />
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-2.5 sm:mt-5 sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 sm:h-9 sm:w-9">
            {freeRemaining > 0 ? <Gift className="h-4 w-4 text-white/80" /> : <Wallet className="h-4 w-4 text-white/80" />}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white/85">Gratis tegoed</div>
            <div className="mt-0.5 text-xs leading-5 text-white/55 sm:mt-1 sm:text-sm sm:leading-6">Gebruik zichtbaar onder je tools.</div>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/30 sm:mt-4 sm:h-2.5">
          <div className="h-full rounded-full bg-emerald-300/65" style={{ width: `${usedPct}%` }} />
        </div>
      </div>
    </div>
  );
}
